import { Component, ViewEncapsulation } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { OverlayContainer } from '@angular/cdk/overlay';
import { DOWN_ARROW, END, ENTER, ESCAPE, HOME, SPACE, TAB, UP_ARROW } from '@angular/cdk/keycodes';
// jest-axe v10 has no TS declarations — use require()
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { axe, toHaveNoViolations } = require('jest-axe') as {
  axe: (
    element: Element | Document,
    options?: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  toHaveNoViolations: Record<string, jest.CustomMatcher>;
};

import { HaSelect } from './select.component';
import type { HaSelectOption, HaSelectSize } from './select.types';

/**
 * Dispatches a synthetic `keydown` event with a working `keyCode` (task 3.2,
 * deferred from Phase 3 — see apply-progress Deviation #1). jsdom drops
 * `keyCode` from `KeyboardEventInit`, and `ListKeyManager.onKeydown` /
 * `Typeahead.handleKey` both read `event.keyCode` as a fallback, so it must
 * be patched onto the event instance directly. `@angular/cdk/testing` is
 * harness-only (banned by the testing skill) and `dispatchKeyboardEvent`
 * lives in the unpublished `testing/private`.
 */
function dispatchKeydown(
  el: HTMLElement,
  key: string,
  keyCode: number,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  el.dispatchEvent(event);
  return event;
}

expect.extend(toHaveNoViolations);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

const FRUIT_OPTIONS: HaSelectOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
];

/** Distinct first letters for the typeahead scenario (`select.spec` Keyboard navigation matrix). */
const TYPEAHEAD_OPTIONS: HaSelectOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Apricot', value: 'apricot' },
];

/**
 * Test host that wraps HaSelect in a reactive form, matching real consumer
 * usage with `<ha-select [formControl]="control">`.
 */
@Component({
  selector: 'ha-select-test-host',
  standalone: true,
  imports: [HaSelect, ReactiveFormsModule],
  encapsulation: ViewEncapsulation.None,
  template: `
    <ha-select
      id="ha-select-test"
      [formControl]="control"
      [options]="options"
      [size]="size"
      [placeholder]="placeholder"
      [disabled]="disabled"
      [readonly]="readonly"
      [ariaLabel]="ariaLabel"
      [ariaDescribedBy]="ariaDescribedBy"
      (opened)="onOpened()"
      (closed)="onClosed()"
    ></ha-select>
  `,
})
class TestHost {
  control = new FormControl<unknown>(null);
  options: HaSelectOption[] = FRUIT_OPTIONS;
  size: HaSelectSize = 'md';
  placeholder = 'Select a fruit';
  disabled = false;
  readonly = false;
  ariaLabel = 'Fruit';
  ariaDescribedBy = '';
  openedCount = 0;
  closedCount = 0;
  onOpened(): void {
    this.openedCount++;
  }
  onClosed(): void {
    this.closedCount++;
  }
}

/**
 * Standalone host WITHOUT any form directive — proves HaSelect works outside
 * a form (ngControl is null, no errors).
 */
@Component({
  selector: 'ha-select-standalone-host',
  standalone: true,
  imports: [HaSelect],
  encapsulation: ViewEncapsulation.None,
  template: `<ha-select [options]="options" placeholder="Pick one"></ha-select>`,
})
class StandaloneHost {
  options: HaSelectOption[] = FRUIT_OPTIONS;
}

/**
 * Template-driven forms host — proves `[(ngModel)]` round-trips (spec
 * scenario "Template-driven `ngModel` round-trips"), NOT merely documented
 * in README. Uses `FormsModule`, deliberately no `ReactiveFormsModule`.
 */
@Component({
  selector: 'ha-select-ngmodel-test-host',
  standalone: true,
  imports: [HaSelect, FormsModule],
  encapsulation: ViewEncapsulation.None,
  template: `<ha-select
    [(ngModel)]="selected"
    [options]="options"
    placeholder="Select a fruit"
  ></ha-select>`,
})
class NgModelTestHost {
  selected: unknown = null;
  options: HaSelectOption[] = FRUIT_OPTIONS;
}

describe('HaSelect', () => {
  // Every fixture created via `createTestHost()` or directly in a test is
  // tracked here and destroyed in `afterEach` below — the file never
  // declared a describe-scoped `fixture` (each `it`/`createTestHost` call
  // creates its own local one), so destruction is promoted to this
  // module-level list instead of a single `fixture` variable. Without an
  // explicit `fixture.destroy()`, the `fakeAsync`/`tick(200)` typeahead test
  // relies entirely on TestBed's implicit teardown to run `destroyRef.onDestroy()`
  // (select.component.ts) and unsubscribe the CDK `ActiveDescendantKeyManager`
  // debounce timer.
  const activeFixtures: ComponentFixture<unknown>[] = [];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost, StandaloneHost, NgModelTestHost],
    }).compileComponents();
  });

  afterEach(() => {
    activeFixtures.forEach((fixture) => fixture.destroy());
    activeFixtures.length = 0;
  });

  function createTestHost(): {
    fixture: ComponentFixture<TestHost>;
    host: TestHost;
    triggerEl: HTMLButtonElement;
    hostEl: HTMLElement;
  } {
    const fixture = TestBed.createComponent(TestHost);
    activeFixtures.push(fixture);
    const host = fixture.componentInstance;
    const triggerEl = fixture.debugElement.query(By.css('[role="combobox"]'))
      .nativeElement as HTMLButtonElement;
    const hostEl = fixture.debugElement.query(By.directive(HaSelect)).nativeElement as HTMLElement;
    return { fixture, host, triggerEl, hostEl };
  }

  /**
   * Subscribes a `jest.fn()` spy directly to the `HaSelect` instance's
   * `valueChange` output. Every commit-path test MUST assert this spy in
   * addition to `control.value` — `onChange` and `valueChange.emit` share a
   * code path that line coverage marks green even if one call is dropped.
   */
  function spyOnValueChange(fixture: ComponentFixture<TestHost>): jest.Mock {
    const spy = jest.fn();
    const select = fixture.debugElement.query(By.directive(HaSelect)).componentInstance as HaSelect;
    select.valueChange.subscribe(spy);
    return spy;
  }

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------
  describe('rendering', () => {
    it('should render a trigger button with role combobox', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();

      expect(triggerEl.tagName).toBe('BUTTON');
      expect(triggerEl.getAttribute('role')).toBe('combobox');
    });

    it('should always have the base BEM class ha-select on the host element', () => {
      const { fixture, hostEl } = createTestHost();
      fixture.detectChanges();

      expect(hostEl.classList.contains('ha-select')).toBe(true);
    });

    it('should show the placeholder text when no value is selected', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();

      expect(triggerEl.textContent?.trim()).toBe('Select a fruit');
    });

    it('should show the label of the option matching the bound value', () => {
      const { fixture, host, triggerEl } = createTestHost();
      host.control.setValue('banana');
      fixture.detectChanges();

      expect(triggerEl.textContent?.trim()).toBe('Banana');
    });

    it('should have aria-haspopup listbox and aria-expanded false by default (panel closed)', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();

      expect(triggerEl.getAttribute('aria-haspopup')).toBe('listbox');
      expect(triggerEl.getAttribute('aria-expanded')).toBe('false');
    });

    it('should apply aria-label from the input', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();

      expect(triggerEl.getAttribute('aria-label')).toBe('Fruit');
    });

    it('should not render the overlay/listbox panel while closed', () => {
      const { fixture } = createTestHost();
      fixture.detectChanges();

      expect(document.querySelector('[role="listbox"]')).toBeNull();
    });

    it('should render a chevron-down icon in the trigger', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.css('ha-icon'));
      expect(icon).not.toBeNull();
      expect(icon.componentInstance.name()).toBe('chevron-down');
      expect(triggerEl.querySelector('ha-icon')).not.toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Overlay open/close (Phase 4)
  // -----------------------------------------------------------------------
  describe('overlay open/close', () => {
    let overlayContainer: OverlayContainer;
    let containerEl: HTMLElement;

    beforeEach(() => {
      overlayContainer = TestBed.inject(OverlayContainer);
      containerEl = overlayContainer.getContainerElement();
    });

    afterEach(() => {
      overlayContainer.ngOnDestroy();
    });

    function getPanel(): HTMLElement | null {
      return containerEl.querySelector('[role="listbox"]');
    }

    it('opens the panel and emits opened when the trigger is clicked', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();
      expect(getPanel()).toBeNull();

      triggerEl.click();
      fixture.detectChanges();

      expect(getPanel()).not.toBeNull();
      expect(host.openedCount).toBe(1);
    });

    it('toggles the chevron rotation class with the panel open state', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();
      const chevron = triggerEl.querySelector('.ha-select__chevron')!;
      expect(chevron.classList.contains('ha-select__chevron--open')).toBe(false);

      triggerEl.click();
      fixture.detectChanges();
      expect(chevron.classList.contains('ha-select__chevron--open')).toBe(true);

      dispatchKeydown(triggerEl, 'Escape', ESCAPE);
      fixture.detectChanges();
      expect(chevron.classList.contains('ha-select__chevron--open')).toBe(false);
    });

    it('closes the panel and emits closed when the open trigger is clicked again (toggle)', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();

      triggerEl.click();
      fixture.detectChanges();
      expect(getPanel()).not.toBeNull();
      expect(host.openedCount).toBe(1);

      triggerEl.click();
      fixture.detectChanges();
      expect(getPanel()).toBeNull();
      expect(host.closedCount).toBe(1);
    });

    it('opens the panel when Enter is pressed while closed', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();

      dispatchKeydown(triggerEl, 'Enter', ENTER);
      fixture.detectChanges();

      expect(getPanel()).not.toBeNull();
      expect(host.openedCount).toBe(1);
    });

    it('opens the panel when Space is pressed while closed', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();

      dispatchKeydown(triggerEl, ' ', SPACE);
      fixture.detectChanges();

      expect(getPanel()).not.toBeNull();
      expect(host.openedCount).toBe(1);
    });

    it('opens the panel when ArrowDown is pressed while closed', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();

      dispatchKeydown(triggerEl, 'ArrowDown', DOWN_ARROW);
      fixture.detectChanges();

      expect(getPanel()).not.toBeNull();
      expect(host.openedCount).toBe(1);
    });

    it('closes the panel and emits closed on outside click, without changing the value', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      expect(getPanel()).not.toBeNull();

      document.body.click();
      fixture.detectChanges();

      expect(getPanel()).toBeNull();
      expect(host.closedCount).toBe(1);
      expect(host.control.value).toBeNull();
    });

    it('closes the panel on Escape without changing the value', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      expect(getPanel()).not.toBeNull();

      dispatchKeydown(triggerEl, 'Escape', ESCAPE);
      fixture.detectChanges();

      expect(getPanel()).toBeNull();
      expect(host.closedCount).toBe(1);
      expect(host.control.value).toBeNull();
    });

    it('closes the panel when the trigger blurs while open', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      expect(getPanel()).not.toBeNull();

      triggerEl.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(getPanel()).toBeNull();
      expect(host.closedCount).toBe(1);
    });

    it('opens an empty panel with zero role="option" elements when options is empty', () => {
      const { fixture, host, triggerEl } = createTestHost();
      host.options = [];
      fixture.detectChanges();

      triggerEl.click();
      fixture.detectChanges();

      const panel = getPanel();
      expect(panel).not.toBeNull();
      expect(panel!.querySelectorAll('[role="option"]')).toHaveLength(0);
    });

    it('renders one role="option" element per option when the panel is open (triangulation)', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();

      triggerEl.click();
      fixture.detectChanges();

      const panel = getPanel();
      expect(panel!.querySelectorAll('[role="option"]')).toHaveLength(FRUIT_OPTIONS.length);
    });

    it('sets aria-selected="true" only on the option matching the current value', () => {
      const { fixture, host, triggerEl } = createTestHost();
      host.control.setValue('banana');
      fixture.detectChanges();

      triggerEl.click();
      fixture.detectChanges();

      const panel = getPanel();
      const selectedFlags = Array.from(panel!.querySelectorAll('[role="option"]')).map((el) =>
        el.getAttribute('aria-selected'),
      );
      expect(selectedFlags).toEqual(['false', 'true', 'false']);
    });

    it('sets aria-selected="false" on every option when no value is selected (triangulation)', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();

      triggerEl.click();
      fixture.detectChanges();

      const panel = getPanel();
      const selectedFlags = Array.from(panel!.querySelectorAll('[role="option"]')).map((el) =>
        el.getAttribute('aria-selected'),
      );
      expect(selectedFlags).toEqual(['false', 'false', 'false']);
    });

    it('does not open the panel when disabled', () => {
      const { fixture, host, triggerEl } = createTestHost();
      host.disabled = true;
      fixture.detectChanges();

      triggerEl.click();
      fixture.detectChanges();

      expect(getPanel()).toBeNull();
      expect(host.openedCount).toBe(0);
    });

    it('does not open the panel when readonly', () => {
      const { fixture, host, triggerEl } = createTestHost();
      host.readonly = true;
      fixture.detectChanges();

      triggerEl.click();
      fixture.detectChanges();

      expect(getPanel()).toBeNull();
      expect(host.openedCount).toBe(0);
    });

    it('marks a disabled option with aria-disabled="true"', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();

      triggerEl.click();
      fixture.detectChanges();

      const panel = getPanel();
      const cherryOption = panel!.querySelectorAll('[role="option"]')[2] as HTMLElement;
      expect(cherryOption.textContent?.trim()).toBe('Cherry');
      expect(cherryOption.getAttribute('aria-disabled')).toBe('true');
    });
  });

  // -----------------------------------------------------------------------
  // Mouse selection (click-to-commit) — spec R3 "Clicking an enabled option
  // commits it"/"Clicking a disabled option is a no-op" scenarios.
  // -----------------------------------------------------------------------
  describe('mouse selection (click-to-commit)', () => {
    let overlayContainer: OverlayContainer;
    let containerEl: HTMLElement;

    beforeEach(() => {
      overlayContainer = TestBed.inject(OverlayContainer);
      containerEl = overlayContainer.getContainerElement();
    });

    afterEach(() => {
      overlayContainer.ngOnDestroy();
    });

    function getPanel(): HTMLElement | null {
      return containerEl.querySelector('[role="listbox"]');
    }

    it('clicking an enabled option commits it, emits valueChange, closes the panel, and returns focus to the trigger', () => {
      const { fixture, host, triggerEl } = createTestHost();
      const valueChangeSpy = spyOnValueChange(fixture);
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();

      const panel = getPanel();
      const bananaOption = panel!.querySelectorAll('[role="option"]')[1] as HTMLElement;
      bananaOption.click();
      fixture.detectChanges();

      expect(host.control.value).toBe('banana');
      expect(valueChangeSpy).toHaveBeenCalledWith('banana');
      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(triggerEl);
    });

    it('clicking a disabled option is a no-op: no value change, no valueChange emission, panel stays open', () => {
      const { fixture, host, triggerEl } = createTestHost();
      const valueChangeSpy = spyOnValueChange(fixture);
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();

      const panel = getPanel();
      const cherryOption = panel!.querySelectorAll('[role="option"]')[2] as HTMLElement;
      cherryOption.click();
      fixture.detectChanges();

      expect(host.control.value).toBeNull();
      expect(valueChangeSpy).not.toHaveBeenCalled();
      expect(getPanel()).not.toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Keyboard navigation matrix + full ARIA wiring (Phase 5)
  // -----------------------------------------------------------------------
  describe('keyboard navigation matrix', () => {
    let overlayContainer: OverlayContainer;
    let containerEl: HTMLElement;

    beforeEach(() => {
      overlayContainer = TestBed.inject(OverlayContainer);
      containerEl = overlayContainer.getContainerElement();
    });

    afterEach(() => {
      overlayContainer.ngOnDestroy();
    });

    function getPanel(): HTMLElement | null {
      return containerEl.querySelector('[role="listbox"]');
    }

    /** Resolves the currently active option's visible label via aria-activedescendant. */
    function activeOptionLabel(triggerEl: HTMLButtonElement): string | null {
      const activeId = triggerEl.getAttribute('aria-activedescendant');
      if (!activeId) {
        return null;
      }
      const optionEl = containerEl.querySelector(`#${activeId}`);
      return optionEl ? (optionEl.textContent?.trim() ?? null) : null;
    }

    it('seeds the active option to the first enabled option when opened with no selection', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();

      triggerEl.click();
      fixture.detectChanges();

      expect(activeOptionLabel(triggerEl)).toBe('Apple');
    });

    it('seeds the active option to the currently selected option when opened (triangulation)', () => {
      const { fixture, host, triggerEl } = createTestHost();
      host.control.setValue('banana');
      fixture.detectChanges();

      triggerEl.click();
      fixture.detectChanges();

      expect(activeOptionLabel(triggerEl)).toBe('Banana');
    });

    it('sets aria-controls on the trigger to the id of the open panel', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();

      triggerEl.click();
      fixture.detectChanges();

      const panel = getPanel();
      expect(triggerEl.getAttribute('aria-controls')).toBe(panel!.id);
    });

    it('ArrowDown moves the active option forward, skipping disabled options', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      expect(activeOptionLabel(triggerEl)).toBe('Apple');

      dispatchKeydown(triggerEl, 'ArrowDown', DOWN_ARROW);
      fixture.detectChanges();

      expect(activeOptionLabel(triggerEl)).toBe('Banana');
    });

    it('ArrowDown wraps past the last enabled option to the first', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      dispatchKeydown(triggerEl, 'ArrowDown', DOWN_ARROW);
      fixture.detectChanges();
      expect(activeOptionLabel(triggerEl)).toBe('Banana');

      dispatchKeydown(triggerEl, 'ArrowDown', DOWN_ARROW);
      fixture.detectChanges();

      expect(activeOptionLabel(triggerEl)).toBe('Apple');
    });

    it('ArrowUp wraps from the first enabled option to the last enabled option', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      expect(activeOptionLabel(triggerEl)).toBe('Apple');

      dispatchKeydown(triggerEl, 'ArrowUp', UP_ARROW);
      fixture.detectChanges();

      expect(activeOptionLabel(triggerEl)).toBe('Banana');
    });

    it('Home activates the first enabled option', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      dispatchKeydown(triggerEl, 'ArrowDown', DOWN_ARROW);
      fixture.detectChanges();
      expect(activeOptionLabel(triggerEl)).toBe('Banana');

      dispatchKeydown(triggerEl, 'Home', HOME);
      fixture.detectChanges();

      expect(activeOptionLabel(triggerEl)).toBe('Apple');
    });

    it('End activates the last enabled option', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      expect(activeOptionLabel(triggerEl)).toBe('Apple');

      dispatchKeydown(triggerEl, 'End', END);
      fixture.detectChanges();

      expect(activeOptionLabel(triggerEl)).toBe('Banana');
    });

    it('Enter commits the active option, emits valueChange, closes the panel, and keeps focus on the trigger', () => {
      const { fixture, host, triggerEl } = createTestHost();
      const valueChangeSpy = spyOnValueChange(fixture);
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      dispatchKeydown(triggerEl, 'ArrowDown', DOWN_ARROW);
      fixture.detectChanges();
      triggerEl.focus();

      dispatchKeydown(triggerEl, 'Enter', ENTER);
      fixture.detectChanges();

      expect(host.control.value).toBe('banana');
      expect(valueChangeSpy).toHaveBeenCalledWith('banana');
      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(triggerEl);
    });

    it('Space commits the active option and emits valueChange (triangulation with a different option/value)', () => {
      const { fixture, host, triggerEl } = createTestHost();
      const valueChangeSpy = spyOnValueChange(fixture);
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();

      dispatchKeydown(triggerEl, ' ', SPACE);
      fixture.detectChanges();

      expect(host.control.value).toBe('apple');
      expect(valueChangeSpy).toHaveBeenCalledWith('apple');
      expect(getPanel()).toBeNull();
    });

    it('Escape cancels without changing the value even when an option is active', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      dispatchKeydown(triggerEl, 'ArrowDown', DOWN_ARROW);
      fixture.detectChanges();

      dispatchKeydown(triggerEl, 'Escape', ESCAPE);
      fixture.detectChanges();

      expect(host.control.value).toBeNull();
      expect(getPanel()).toBeNull();
    });

    it('keeps focus on the trigger after Escape closes the panel', () => {
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      triggerEl.focus();
      expect(document.activeElement).toBe(triggerEl);

      dispatchKeydown(triggerEl, 'Escape', ESCAPE);
      fixture.detectChanges();

      expect(getPanel()).toBeNull();
      expect(document.activeElement).toBe(triggerEl);
    });

    it('Tab commits the active option before moving focus: value updates, valueChange emits, panel closes, and preventDefault is NOT called', () => {
      const { fixture, host, triggerEl } = createTestHost();
      const valueChangeSpy = spyOnValueChange(fixture);
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();

      const event = dispatchKeydown(triggerEl, 'Tab', TAB);
      fixture.detectChanges();

      expect(host.control.value).toBe('apple');
      expect(valueChangeSpy).toHaveBeenCalledWith('apple');
      expect(getPanel()).toBeNull();
      expect(event.defaultPrevented).toBe(false);
    });

    it('Alt+ArrowUp commits the active option, emits valueChange, and closes the panel', () => {
      const { fixture, host, triggerEl } = createTestHost();
      const valueChangeSpy = spyOnValueChange(fixture);
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      dispatchKeydown(triggerEl, 'ArrowDown', DOWN_ARROW);
      fixture.detectChanges();
      expect(activeOptionLabel(triggerEl)).toBe('Banana');

      dispatchKeydown(triggerEl, 'ArrowUp', UP_ARROW, { altKey: true });
      fixture.detectChanges();

      expect(host.control.value).toBe('banana');
      expect(valueChangeSpy).toHaveBeenCalledWith('banana');
      expect(getPanel()).toBeNull();
    });

    it('typeahead jumps the active option to the next label starting with the typed character, debounced', fakeAsync(() => {
      const { fixture, host, triggerEl } = createTestHost();
      host.options = TYPEAHEAD_OPTIONS;
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      expect(activeOptionLabel(triggerEl)).toBe('Apple');

      dispatchKeydown(triggerEl, 'a', 65);
      fixture.detectChanges();
      expect(activeOptionLabel(triggerEl)).toBe('Apple');

      tick(200);
      fixture.detectChanges();

      expect(activeOptionLabel(triggerEl)).toBe('Apricot');
    }));

    it('is a no-op for an irrelevant key while closed (e.g. a modifier-only key like Escape)', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();

      dispatchKeydown(triggerEl, 'Escape', ESCAPE);
      fixture.detectChanges();

      expect(getPanel()).toBeNull();
      expect(host.openedCount).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // Size classes
  // -----------------------------------------------------------------------
  describe('size classes', () => {
    it('should apply ha-select--md by default', () => {
      const { fixture, host, hostEl } = createTestHost();
      host.size = 'md';
      fixture.detectChanges();

      expect(hostEl.classList.contains('ha-select--md')).toBe(true);
    });

    it('should apply ha-select--sm when size is sm', () => {
      const { fixture, host, hostEl } = createTestHost();
      host.size = 'sm';
      fixture.detectChanges();

      expect(hostEl.classList.contains('ha-select--sm')).toBe(true);
    });

    it('should apply ha-select--lg when size is lg', () => {
      const { fixture, host, hostEl } = createTestHost();
      host.size = 'lg';
      fixture.detectChanges();

      expect(hostEl.classList.contains('ha-select--lg')).toBe(true);
    });

    it('should NOT have classes for other sizes', () => {
      const { fixture, host, hostEl } = createTestHost();
      host.size = 'sm';
      fixture.detectChanges();

      expect(hostEl.classList.contains('ha-select--md')).toBe(false);
      expect(hostEl.classList.contains('ha-select--lg')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Disabled state / tab order
  // -----------------------------------------------------------------------
  describe('disabled state', () => {
    it('should set native disabled, aria-disabled, and the class when [disabled] is true', () => {
      const { fixture, host, triggerEl, hostEl } = createTestHost();
      host.disabled = true;
      fixture.detectChanges();

      expect(triggerEl.disabled).toBe(true);
      expect(triggerEl.getAttribute('aria-disabled')).toBe('true');
      expect(hostEl.classList.contains('ha-select--disabled')).toBe(true);
    });

    it('should remove the trigger from the tab order when disabled', () => {
      const { fixture, host, triggerEl } = createTestHost();
      host.disabled = true;
      fixture.detectChanges();

      // Native disabled buttons are structurally excluded from the tab order.
      expect(triggerEl.disabled).toBe(true);
    });

    it('should disable the trigger when the bound control is disabled (CVA setDisabledState)', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();

      host.control.disable();
      fixture.detectChanges();

      expect(triggerEl.disabled).toBe(true);
    });

    it('should re-enable the trigger when the bound control is enabled (CVA setDisabledState)', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();

      host.control.disable();
      fixture.detectChanges();
      expect(triggerEl.disabled).toBe(true);

      host.control.enable();
      fixture.detectChanges();

      expect(triggerEl.disabled).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Readonly state / tab order
  // -----------------------------------------------------------------------
  describe('readonly state', () => {
    it('should keep the trigger focusable/tabbable (NOT disabled) when readonly', () => {
      const { fixture, host, triggerEl, hostEl } = createTestHost();
      host.readonly = true;
      fixture.detectChanges();

      expect(triggerEl.disabled).toBe(false);
      expect(triggerEl.tabIndex).toBe(0);
      expect(hostEl.classList.contains('ha-select--readonly')).toBe(true);
    });

    it('should remove the readonly class when [readonly] is false', () => {
      const { fixture, host, hostEl } = createTestHost();
      host.readonly = false;
      fixture.detectChanges();

      expect(hostEl.classList.contains('ha-select--readonly')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Forms integration (ControlValueAccessor)
  // -----------------------------------------------------------------------
  describe('forms integration (ControlValueAccessor)', () => {
    it('should render the label of the option matching control.setValue', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();

      host.control.setValue('apple');
      fixture.detectChanges();

      expect(triggerEl.textContent?.trim()).toBe('Apple');
    });

    it('writeValue with a value NOT present in options shows the placeholder and does NOT clear the control value', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();

      host.control.setValue('missing-id');
      fixture.detectChanges();

      expect(triggerEl.textContent?.trim()).toBe('Select a fruit');
      expect(host.control.value).toBe('missing-id');
    });

    it('should mark the control touched on trigger blur', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();

      triggerEl.dispatchEvent(new Event('blur'));

      expect(host.control.touched).toBe(true);
    });

    it('should mark the control touched when the panel closes without a blur (e.g. Escape)', () => {
      const { fixture, host, triggerEl } = createTestHost();
      fixture.detectChanges();
      triggerEl.click();
      fixture.detectChanges();
      expect(host.control.touched).toBe(false);

      dispatchKeydown(triggerEl, 'Escape', ESCAPE);
      fixture.detectChanges();

      expect(host.control.touched).toBe(true);
    });

    it('should work outside a form control (standalone host, ngControl null, no errors)', () => {
      const fixture = TestBed.createComponent(StandaloneHost);
      activeFixtures.push(fixture);
      fixture.detectChanges();

      const triggerEl = fixture.nativeElement.querySelector(
        '[role="combobox"]',
      ) as HTMLButtonElement;
      expect(triggerEl).not.toBeNull();
      expect(triggerEl.textContent?.trim()).toBe('Pick one');
    });
  });

  // -----------------------------------------------------------------------
  // Template-driven forms (ngModel) — spec scenario "Template-driven
  // `ngModel` round-trips" (R2-S4), previously untested (no FormsModule/
  // ngModel anywhere in this suite).
  // -----------------------------------------------------------------------
  describe('template-driven forms (ngModel)', () => {
    it('round-trips [(ngModel)]: selecting an option updates the bound property and the trigger reflects the new label', () => {
      const fixture = TestBed.createComponent(NgModelTestHost);
      activeFixtures.push(fixture);
      const host = fixture.componentInstance;
      fixture.detectChanges();

      const triggerEl = fixture.debugElement.query(By.css('[role="combobox"]'))
        .nativeElement as HTMLButtonElement;
      expect(triggerEl.textContent?.trim()).toBe('Select a fruit');

      triggerEl.click();
      fixture.detectChanges();
      dispatchKeydown(triggerEl, 'ArrowDown', DOWN_ARROW);
      fixture.detectChanges();

      dispatchKeydown(triggerEl, 'Enter', ENTER);
      fixture.detectChanges();

      expect(host.selected).toBe('banana');
      expect(triggerEl.textContent?.trim()).toBe('Banana');
    });
  });

  // -----------------------------------------------------------------------
  // Error state
  // -----------------------------------------------------------------------
  describe('error state', () => {
    it('should apply .ha-select--error and aria-invalid="true" when the control is invalid and touched', () => {
      const { fixture, host, triggerEl, hostEl } = createTestHost();
      fixture.detectChanges();

      host.control.setValidators(Validators.required);
      host.control.updateValueAndValidity();
      host.control.markAsTouched();
      fixture.detectChanges();

      expect(hostEl.classList.contains('ha-select--error')).toBe(true);
      expect(triggerEl.getAttribute('aria-invalid')).toBe('true');
    });

    it('should NOT apply the error class when invalid but untouched', () => {
      const { fixture, host, triggerEl, hostEl } = createTestHost();
      fixture.detectChanges();

      host.control.setValidators(Validators.required);
      host.control.updateValueAndValidity();
      fixture.detectChanges();

      expect(hostEl.classList.contains('ha-select--error')).toBe(false);
      expect(triggerEl.getAttribute('aria-invalid')).toBeNull();
    });

    it('should clear the error state when the control becomes valid', () => {
      const { fixture, host, triggerEl, hostEl } = createTestHost();
      fixture.detectChanges();

      host.control.setValidators(Validators.required);
      host.control.updateValueAndValidity();
      host.control.markAsTouched();
      fixture.detectChanges();
      expect(hostEl.classList.contains('ha-select--error')).toBe(true);

      host.control.setValue('apple');
      fixture.detectChanges();

      expect(hostEl.classList.contains('ha-select--error')).toBe(false);
      expect(triggerEl.getAttribute('aria-invalid')).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Architectural compliance
  // -----------------------------------------------------------------------
  describe('architectural compliance', () => {
    it('should be a standalone component', () => {
      const { fixture } = createTestHost();
      fixture.detectChanges();

      const selectDebug = fixture.debugElement.query(By.directive(HaSelect));
      expect(selectDebug!.componentInstance).toBeDefined();
    });

    it('should use OnPush change detection (input change re-renders the DOM)', () => {
      const { fixture, host, hostEl } = createTestHost();
      fixture.detectChanges();

      host.size = 'lg';
      fixture.detectChanges();

      expect(hostEl.classList.contains('ha-select--lg')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Accessibility (jest-axe)
  // -----------------------------------------------------------------------
  describe('accessibility', () => {
    it('should have no accessibility violations in the default closed state', async () => {
      const { fixture } = createTestHost();
      fixture.detectChanges();

      const results = await axe(fixture.nativeElement);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when disabled', async () => {
      const { fixture, host } = createTestHost();
      host.disabled = true;
      fixture.detectChanges();

      const results = await axe(fixture.nativeElement);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when invalid and touched', async () => {
      const { fixture, host } = createTestHost();
      fixture.detectChanges();

      host.control.setValidators(Validators.required);
      host.control.updateValueAndValidity();
      host.control.markAsTouched();
      fixture.detectChanges();

      const results = await axe(fixture.nativeElement);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations when the panel is open', async () => {
      const overlayContainer = TestBed.inject(OverlayContainer);
      const { fixture, triggerEl } = createTestHost();
      fixture.detectChanges();

      triggerEl.click();
      fixture.detectChanges();

      // Scoped to document.body (NOT fixture.nativeElement): aria-controls and
      // aria-activedescendant reference ids inside the CDK overlay container,
      // which renders outside the fixture root — scoping to the fixture alone
      // yields false aria-valid-attr-value violations. The "region" rule is
      // disabled because it flags the whole page (Karma/Jest test root has no
      // <main>/<nav> landmarks) — a full-page-layout concern unrelated to
      // HaSelect's own accessibility contract, which is asserted below.
      const results = await axe(document.body, { rules: { region: { enabled: false } } });
      expect(results).toHaveNoViolations();

      overlayContainer.ngOnDestroy();
    });
  });
});
