import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CdkConnectedOverlay } from '@angular/cdk/overlay';
import { HaIcon } from '@halolib-ui/angular/icon';
import type { HaBreadcrumbItem, HaBreadcrumbSize } from './breadcrumb.types';
import { HA_BREADCRUMB_POSITIONS, HA_BREADCRUMB_VIEWPORT_MARGIN } from './breadcrumb.constants';
import { createHaBreadcrumbScrollStrategy } from './breadcrumb.scroll-strategy';

/**
 * Themed breadcrumb trail (custom element `ha-breadcrumb`, no native
 * equivalent — like `ha-select`). Renders a `<nav aria-label="breadcrumb">`
 * with an ordered list of items. The last item is always the current page:
 * it never links (even if it carries a `link`) and gets `aria-current="page"`.
 * Every other item with a `link` renders as a `RouterLink` anchor; without one
 * it renders as plain, non-interactive text. Each item may carry an `icon`,
 * rendered before its label.
 *
 * When `maxVisible` is a positive integer and there are more items than that
 * would leave hidden (there must be at least one item actually hidden in
 * between), the trail collapses to its first `maxVisible` items + "…" + the
 * last item — the leading items render inline, and the items in between are
 * reachable through a `CdkConnectedOverlay` popover opened by the "…"
 * trigger — the same connected-overlay pattern `HaSelect` uses for its panel
 * (`select.component.ts`), scaled down to a simple, non-keyboard-navigated
 * list (no `ActiveDescendantKeyManager`: every item here is either a real
 * link or plain text, never a stateful option). `undefined` (default), `0`,
 * a negative number, or a non-integer all disable collapsing — every item
 * renders inline, same as if `maxVisible` were never passed.
 */
@Component({
  selector: 'ha-breadcrumb',
  standalone: true,
  imports: [RouterLink, HaIcon, CdkConnectedOverlay, NgTemplateOutlet],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class HaBreadcrumb {
  /** Ordered breadcrumb trail, from the root down to the current page. */
  readonly items = input.required<HaBreadcrumbItem[]>();

  /** Size preset: sm, md, or lg. */
  readonly size = input<HaBreadcrumbSize>('md');

  /** Separator rendered between items (not after the last one). */
  readonly separator = input('/');

  /**
   * Number of leading items to show before collapsing the rest to "…" + the
   * last item. Must be a positive integer to take effect — `undefined`
   * (default), `0`, a negative number, or a non-integer all disable
   * collapsing (every item renders inline).
   */
  readonly maxVisible = input<number | undefined>(undefined);

  /** Reference to the "…" trigger button — the overlay's connection origin. Only present while collapsed. */
  protected readonly ellipsisTriggerRef =
    viewChild<ElementRef<HTMLButtonElement>>('ellipsisTrigger');

  /** Last open request for the collapsed-items overlay. */
  private readonly openRequested = signal(false);

  /** Connected-overlay fallback positions for the collapsed-items popover. */
  protected readonly positions = HA_BREADCRUMB_POSITIONS;

  /** Minimum gap (px) kept between the popover and the viewport edge. */
  protected readonly viewportMargin = HA_BREADCRUMB_VIEWPORT_MARGIN;

  /** Repositions the popover on scroll — see `breadcrumb.scroll-strategy.ts`. */
  protected readonly scrollStrategy = createHaBreadcrumbScrollStrategy();

  /**
   * Computed: `true` only when `maxVisible` is a positive integer AND there is
   * at least one item actually hidden in between the leading items and the
   * last one (`total > maxVisible + 1` — otherwise every item already fits
   * without collapsing anything).
   */
  protected readonly isCollapsed = computed(() => {
    const max = this.maxVisible();
    const total = this.items().length;
    return max !== undefined && Number.isInteger(max) && max > 0 && total > max + 1;
  });

  /** Computed: the leading items shown before the "…" trigger while collapsed, empty otherwise. */
  protected readonly visibleLeadingItems = computed(() =>
    this.isCollapsed() ? this.items().slice(0, this.maxVisible() as number) : [],
  );

  /** Computed: the items hidden behind the "…" trigger while collapsed, empty otherwise. */
  protected readonly collapsedItems = computed(() =>
    this.isCollapsed()
      ? this.items().slice(this.maxVisible() as number, this.items().length - 1)
      : [],
  );

  /** Computed: the last item (current page) — always rendered, collapsed or not. */
  protected readonly lastItem = computed(() => this.items()[this.items().length - 1]);

  /** Computed: whether the collapsed-items popover is open. */
  protected readonly panelOpen = computed(() => this.openRequested());

  /** Computed: BEM class string for the host element. */
  protected readonly hostClasses = computed(() =>
    ['ha-breadcrumb', `ha-breadcrumb--${this.size()}`].join(' '),
  );

  /** Toggles the collapsed-items popover. */
  protected toggle(): void {
    this.openRequested.update((open) => !open);
  }

  /** Closes the collapsed-items popover. Idempotent when already closed. */
  protected close(): void {
    this.openRequested.set(false);
  }

  /** Host handler: closes the popover on Escape without letting it bubble further. */
  protected onEllipsisKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.panelOpen()) {
      event.preventDefault();
      this.close();
    }
  }
}
