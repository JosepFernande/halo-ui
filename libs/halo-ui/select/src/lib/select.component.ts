import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  Injector,
  OnInit,
  Output,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { CdkConnectedOverlay } from '@angular/cdk/overlay';
import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { HaIcon } from '@halolib-ui/angular/icon';
import type { HaSelectOption, HaSelectSize } from './select.types';
import {
  HA_SELECT_POSITIONS,
  HA_SELECT_TYPEAHEAD_DEBOUNCE,
  HA_SELECT_VIEWPORT_MARGIN,
} from './select.constants';
import { resolveSelectKeyIntent } from './select.keyboard';
import { createHaSelectScrollStrategy } from './select.scroll-strategy';
import { HaSelectOptionItem } from './select.option-item';
import { findOptionIndexByValue, firstEnabledIndex, nextSelectId, optionId } from './select.utils';

/**
 * Accessible, token-driven single-select combobox (custom element `ha-select`,
 * not an attribute selector) — a `<button role="combobox">` trigger paired
 * with a `CdkConnectedOverlay` panel (`disableClose=true`; Escape is handled
 * by the trigger itself in `onTriggerKeydown`). The trigger toggles the panel
 * on click (also opens on Enter/Space/ArrowDown); closes on outside click,
 * Escape, or blur too, without changing the bound value. `aria-expanded` mirrors `panelOpen()`.
 *
 * Keyboard navigation and commit run through an
 * `ActiveDescendantKeyManager<HaSelectOptionItem>` built over the
 * `optionItems` signal (no RxJS needed). Arrow/Home/End/typeahead only move
 * `aria-activedescendant`; Enter, Space, Tab, Alt+ArrowUp, and clicking an
 * enabled option commit through the CVA `onChange` and close the panel.
 * Escape cancels without committing. `withWrap(true)` lets Arrow navigation
 * wrap past disabled options instead of clamping, per the keyboard spec.
 *
 * Forms integration mirrors `HaInputText`'s `NgControl` lazy-injection +
 * `validityVersion` idiom (`libs/input-text/src/lib/input-text.component.ts`):
 * the bound form directive also injects `NG_VALUE_ACCESSOR` (this component),
 * so resolving `NgControl` eagerly throws NG0200; resolving lazily inside
 * `hasError` breaks the cycle.
 */
@Component({
  selector: 'ha-select',
  standalone: true,
  imports: [CdkConnectedOverlay, HaIcon],
  templateUrl: './select.component.html',
  styleUrl: './select.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => HaSelect), multi: true }],
  host: {
    '[class]': 'hostClasses()',
  },
})
export class HaSelect implements ControlValueAccessor, OnInit {
  /** Selectable options rendered inside the panel. */
  readonly options = input<HaSelectOption[]>([]);

  /** Size preset: sm, md, or lg. */
  readonly size = input<HaSelectSize>('md');

  /** Whether the trigger is disabled. Overridden by the form control when disabled. */
  readonly disabled = input(false);

  /** Whether the trigger is read-only: focusable, but the panel never opens. */
  readonly readonly = input(false);

  /** Placeholder text shown while no option is selected. */
  readonly placeholder = input('');

  /** Accessible label (`aria-label`) for the trigger. */
  readonly ariaLabel = input('');

  /** Comma-separated ids referenced by `aria-describedby` (e.g. hint text). */
  readonly ariaDescribedBy = input('');

  /** Emits the committed value whenever Enter/Space/Tab/Alt+ArrowUp or a click commits an option. */
  @Output() readonly valueChange = new EventEmitter<unknown>();

  /** Emits exactly once per open transition (click, opening key, or programmatic `open()`). */
  @Output() readonly opened = new EventEmitter<void>();

  /** Emits exactly once per close transition (outside click, Escape, blur, or programmatic `close()`). */
  @Output() readonly closed = new EventEmitter<void>();

  /** Disabled state coming from the form control via `setDisabledState`. */
  protected readonly formDisabled = signal(false);

  /** Raw model value, exactly as written by `writeValue` — never normalized. */
  protected readonly valueState = signal<unknown>(null);

  /** Last open request (click/opening key). Not the render source of truth — see `panelOpen`. */
  private readonly openRequested = signal(false);

  /** Reference to the trigger button — the overlay's connection origin. */
  protected readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  /** Width (px) of the overlay panel, measured from the trigger at open time. `0` before the first open is harmless. */
  protected readonly triggerWidth = signal<number>(0);

  /** Connected-overlay fallback positions. */
  protected readonly positions = HA_SELECT_POSITIONS;

  /** Minimum gap (px) kept between the panel and the viewport edge. */
  protected readonly viewportMargin = HA_SELECT_VIEWPORT_MARGIN;

  /**
   * Repositions the panel on scroll. NOT `Overlay.scrollStrategies.reposition()`
   * — that only reacts to containers registered via `cdkScrollable`, which
   * would force every consumer to annotate their own scroll containers. See
   * `select.scroll-strategy.ts` for the capture-phase listener that avoids it.
   */
  protected readonly scrollStrategy = createHaSelectScrollStrategy();

  /** Tracks the last emitted open state so the transition effect below emits exactly once per transition. */
  private lastEmittedOpen = false;

  /** Deterministic instance id — prefixes every option DOM id and the panel id. */
  private readonly selectId = nextSelectId();

  /** DOM id of the listbox panel, referenced by the trigger's `aria-controls`. */
  protected readonly panelId = `${this.selectId}-panel`;

  /** Computed: `Highlightable` wrappers per option, passed as a signal to `ActiveDescendantKeyManager`. */
  protected readonly optionItems = computed<HaSelectOptionItem[]>(() =>
    this.options().map(
      (option, index) => new HaSelectOptionItem(option, optionId(this.selectId, index)),
    ),
  );

  /** Computed: the DOM id of the option the key manager currently considers active, or `null`. */
  protected readonly activeDescendantId = computed(
    () => this.optionItems().find((item) => item.active())?.id ?? null,
  );

  /**
   * `ActiveDescendantKeyManager` over `optionItems`. Built in the
   * constructor body, NOT inside the `effect()` below: CDK's signal-source
   * overload calls `effect()` internally, which throws NG0602 if nested
   * inside another running effect.
   */
  private readonly keyManager: ActiveDescendantKeyManager<HaSelectOptionItem>;

  /**
   * Re-computation trigger for `hasError`: `control.invalid`/`control.touched`
   * are not signals, so every relevant form event (touched, status, value)
   * bumps this version to mark the computed dirty.
   */
  private readonly validityVersion = signal(0);

  /**
   * Element injector used to resolve `NgControl` lazily (see class TSDoc —
   * mirrors `HaInputText`'s NG0200 workaround).
   */
  private readonly injector = inject(Injector);

  /** The form control bound to this select, if any (forms integration). */
  private get ngControl(): NgControl | null {
    return this.injector.get(NgControl, null, { self: true, optional: true });
  }

  private readonly destroyRef = inject(DestroyRef);

  /** Computed: disabled from the input OR from the bound form control. */
  protected readonly effectiveDisabled = computed(() => this.disabled() || this.formDisabled());

  /** Computed: the actual open/rendered state — structurally never `true` while `readonly`/`disabled`. */
  protected readonly panelOpen = computed(
    () => this.openRequested() && !this.effectiveDisabled() && !this.readonly(),
  );

  /**
   * Computed: `true` when the bound control is invalid AND touched — drives
   * `.ha-select--error` and `aria-invalid`. Reactive via `validityVersion`.
   */
  protected readonly hasError = computed(() => {
    this.validityVersion();
    const control = this.ngControl?.control;
    return control != null && control.invalid && control.touched;
  });

  /**
   * Computed: the option whose value matches `valueState` via `Object.is`,
   * or `null` when unmatched (or no value is set). Never mutates
   * `valueState`/the bound control — a later `options()` change re-resolves
   * the same raw value for free.
   */
  protected readonly selectedOption = computed<HaSelectOption | null>(() => {
    const index = findOptionIndexByValue(this.options(), this.valueState());
    return index === -1 ? null : this.options()[index];
  });

  /** Computed: the trigger's visible text — the selected option's label, or the placeholder. */
  protected readonly triggerLabel = computed(
    () => this.selectedOption()?.label ?? this.placeholder(),
  );

  /** Template helper: whether `option` is the currently selected option (`aria-selected`, `.ha-select__option--selected`). */
  protected isSelected(option: HaSelectOption): boolean {
    return Object.is(option.value, this.valueState());
  }

  /** Computed: BEM class string for the host `ha-select` element. */
  protected readonly hostClasses = computed(() =>
    [
      'ha-select',
      `ha-select--${this.size()}`,
      this.effectiveDisabled() ? 'ha-select--disabled' : '',
      this.readonly() ? 'ha-select--readonly' : '',
      this.hasError() ? 'ha-select--error' : '',
    ]
      .filter(Boolean)
      .join(' '),
  );

  /** Change callback registered by the form directive. */
  private onChange: (value: unknown) => void = () => {};

  /** Touch callback registered by the form directive. */
  private onTouched: () => void = () => {};

  constructor(private readonly cdr: ChangeDetectorRef) {
    // Built here, NOT inside the effect() below — see the `keyManager` field
    // TSDoc for why (NG0602: nested effect() creation).
    this.keyManager = new ActiveDescendantKeyManager<HaSelectOptionItem>(
      this.optionItems,
      this.injector,
    )
      .withVerticalOrientation(true)
      .withWrap(true)
      .withHomeAndEnd(true)
      .withTypeAhead(HA_SELECT_TYPEAHEAD_DEBOUNCE);
    this.destroyRef.onDestroy(() => this.keyManager.destroy());

    // One effect emitting `opened`/`closed` on every `panelOpen()` transition
    // — guarantees output/DOM parity instead of duplicating the open/close
    // decision at every call site that can change it (click, keydown, outside
    // click, blur, or disabling/making readonly while open).
    effect(() => {
      const isOpen = this.panelOpen();
      if (isOpen === this.lastEmittedOpen) {
        return;
      }
      this.lastEmittedOpen = isOpen;
      if (isOpen) {
        this.seedActiveItem();
        this.opened.emit();
      } else {
        this.closed.emit();
      }
    });
  }

  ngOnInit(): void {
    // See `HaInputText.ngOnInit` for why a subscription (not a computed()) is
    // required to react to control.invalid/control.touched changes.
    const control = this.ngControl?.control;
    control?.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.validityVersion.update((version) => version + 1);
      this.cdr.markForCheck();
    });
  }

  /** ControlValueAccessor: stores the raw model value; never mutates the control. */
  writeValue(value: unknown): void {
    this.valueState.set(value ?? null);
  }

  /** ControlValueAccessor: stores the change callback the form directive provides. */
  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  /** ControlValueAccessor: stores the touch callback the form directive provides. */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** ControlValueAccessor: mirrors the control's disabled state into the trigger. */
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  /** Host handler: notifies the form control that the trigger was touched, and closes the panel if open. */
  protected onTriggerBlur(): void {
    this.onTouched();
    if (this.panelOpen()) {
      this.close();
    }
  }

  /** Host handler: toggles the panel on trigger click (no-op to open when disabled or readonly). */
  protected onTriggerClick(): void {
    if (this.panelOpen()) return this.close();
    this.open();
  }

  /**
   * Host handler: resolves the keyboard intent and acts on it.
   * `preventDefault` is honored exactly as the pure resolver decided
   * (e.g. `Tab` never calls `preventDefault`, so focus can move on).
   */
  protected onTriggerKeydown(event: KeyboardEvent): void {
    const intent = resolveSelectKeyIntent(event, {
      open: this.panelOpen(),
      disabled: this.effectiveDisabled(),
      readonly: this.readonly(),
    });
    if (intent.preventDefault) {
      event.preventDefault();
    }
    switch (intent.kind) {
      case 'open':
        this.open();
        break;
      case 'cancel':
        this.close();
        break;
      case 'commit':
        this.commitActive();
        break;
      case 'delegate':
        this.keyManager.onKeydown(event);
        break;
      default:
        break;
    }
  }

  /** Requests the panel to open. No-op when disabled or readonly. Measures the trigger width first, since `cdkConnectedOverlayWidth` reads it in the same template pass that flips `cdkConnectedOverlayOpen`. */
  protected open(): void {
    if (this.effectiveDisabled() || this.readonly()) {
      return;
    }
    this.triggerWidth.set(this.triggerRef().nativeElement.offsetWidth);
    this.openRequested.set(true);
  }

  /** Closes the panel and marks the control touched (CVA sketch: touched on blur AND on close). Idempotent when already closed. */
  protected close(): void {
    this.openRequested.set(false);
    this.onTouched();
  }

  /** Shared commit primitive — writes `value` through `onChange`/`valueChange`. Called by both `commitActive` and `onOptionClick`, never duplicated. */
  private commit(value: unknown): void {
    this.valueState.set(value);
    this.onChange(value);
    this.valueChange.emit(value);
  }

  /** Commits the key manager's active option via `commit` and closes. A no-op commit (no active item) still closes without emitting. */
  private commitActive(): void {
    const activeItem = this.keyManager.activeItem;
    if (activeItem) {
      this.commit(activeItem.option.value);
    }
    this.close();
  }

  /** Host handler: click-commits `item` via `commit`, closes, and refocuses the trigger. Disabled options are a no-op. */
  protected onOptionClick(item: HaSelectOptionItem): void {
    if (item.disabled) {
      return;
    }
    this.commit(item.option.value);
    this.close();
    this.triggerRef().nativeElement.focus();
  }

  /**
   * Seeds the key manager's active item on open: the currently selected
   * option if one matches, otherwise the first enabled option.
   */
  private seedActiveItem(): void {
    const selectedIndex = findOptionIndexByValue(this.options(), this.valueState());
    const activeIndex = selectedIndex !== -1 ? selectedIndex : firstEnabledIndex(this.options());
    if (activeIndex !== -1) {
      this.keyManager.setActiveItem(activeIndex);
    }
  }
}
