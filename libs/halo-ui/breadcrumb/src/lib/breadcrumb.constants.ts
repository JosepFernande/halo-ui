import type { ConnectedPosition } from '@angular/cdk/overlay';

/** Minimum gap (px) kept between the collapsed-items overlay and the viewport edge. */
export const HA_BREADCRUMB_VIEWPORT_MARGIN = 8;

/**
 * Connected-overlay fallback positions for the collapsed-items popover:
 * below-start first, above-start as the fallback when there isn't enough
 * room below the ellipsis trigger. Mirrors `select.constants.ts`'s
 * `HA_SELECT_POSITIONS` (`libs/halo-ui/select/src/lib/select.constants.ts`).
 */
export const HA_BREADCRUMB_POSITIONS: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];
