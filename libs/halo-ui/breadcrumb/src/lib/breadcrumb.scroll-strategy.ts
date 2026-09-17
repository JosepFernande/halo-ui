import type { OverlayRef, ScrollStrategy } from '@angular/cdk/overlay';

/**
 * Reposition scroll strategy that never requires `cdkScrollable` from
 * consumers. Duplicated from `select.scroll-strategy.ts`
 * (`libs/halo-ui/select/src/lib/select.scroll-strategy.ts`) rather than
 * imported — that function is a `select`-internal implementation detail, not
 * exported from `@halolib-ui/angular/select`'s public `index.ts`, so
 * `breadcrumb` cannot depend on it without coupling to another component's
 * internals. See that file's header comment for the full rationale:
 * `Overlay.scrollStrategies.reposition()` only reacts to scroll on
 * containers registered with CDK's `ScrollDispatcher` (via the
 * `cdkScrollable` directive) — a capture-phase `window` listener observes
 * every scroll in the document instead, nested container or not, with zero
 * markup required from consumers.
 */
// gga-ignore: custom ScrollStrategy implementation, not Overlay.scrollStrategies.reposition() —
// justified above (reposition() misses scroll on containers without cdkScrollable).
export function createHaBreadcrumbScrollStrategy(): ScrollStrategy {
  let overlayRef: OverlayRef | undefined;
  let listening = false;

  const reposition = (): void => {
    overlayRef?.updatePosition();
  };

  return {
    attach(ref: OverlayRef): void {
      overlayRef = ref;
    },
    enable(): void {
      if (listening) {
        return;
      }
      window.addEventListener('scroll', reposition, true);
      listening = true;
    },
    disable(): void {
      if (!listening) {
        return;
      }
      window.removeEventListener('scroll', reposition, true);
      listening = false;
    },
  };
}
