/**
 * Canonical NAME-shape registry for the `--ha-breadcrumb-*` design tokens. See
 * `component-token-shapes.ts` for why this lives under `theme/` instead of
 * inside `@halolib-ui/breadcrumb` (module-boundary cycle avoidance) and instead
 * of under `foundation/` (the `no-raw-scale-in-theme-engine.spec.ts` path
 * check).
 */

/**
 * Shape of the `--ha-breadcrumb-*` design tokens. Every key maps to the CSS
 * custom property name that carries its value, grouped by semantic concern.
 */
export interface HaBreadcrumbTokens {
  readonly typography: {
    readonly fontFamily: string;
    readonly fontWeight: string;
    readonly lineHeight: string;
  };

  readonly sizing: {
    readonly fontSm: string;
    readonly fontMd: string;
    readonly fontLg: string;
    readonly gapSm: string;
    readonly gapMd: string;
    readonly gapLg: string;
  };

  readonly color: {
    readonly linkColor: string;
    readonly linkHoverColor: string;
    readonly currentColor: string;
    readonly separatorColor: string;
  };

  readonly focus: {
    readonly focusRing: string;
    readonly focusRingOffset: string;
  };

  readonly surface: {
    readonly overlayBg: string;
    readonly overlayBorder: string;
    readonly overlayRadius: string;
    readonly overlayShadow: string;
    readonly overlayPaddingY: string;
    readonly overlayOffset: string;
  };
}

export const HA_BREADCRUMB_TOKENS = {
  typography: {
    fontFamily: '--ha-breadcrumb-font-family',
    fontWeight: '--ha-breadcrumb-font-weight',
    lineHeight: '--ha-breadcrumb-line-height',
  },

  sizing: {
    fontSm: '--ha-breadcrumb-font-sm',
    fontMd: '--ha-breadcrumb-font-md',
    fontLg: '--ha-breadcrumb-font-lg',
    gapSm: '--ha-breadcrumb-gap-sm',
    gapMd: '--ha-breadcrumb-gap-md',
    gapLg: '--ha-breadcrumb-gap-lg',
  },

  color: {
    linkColor: '--ha-breadcrumb-link-color',
    linkHoverColor: '--ha-breadcrumb-link-hover-color',
    currentColor: '--ha-breadcrumb-current-color',
    separatorColor: '--ha-breadcrumb-separator-color',
  },

  focus: {
    focusRing: '--ha-breadcrumb-focus-ring',
    focusRingOffset: '--ha-breadcrumb-focus-ring-offset',
  },

  surface: {
    overlayBg: '--ha-breadcrumb-overlay-bg',
    overlayBorder: '--ha-breadcrumb-overlay-border',
    overlayRadius: '--ha-breadcrumb-overlay-radius',
    overlayShadow: '--ha-breadcrumb-overlay-shadow',
    overlayPaddingY: '--ha-breadcrumb-overlay-padding-y',
    overlayOffset: '--ha-breadcrumb-overlay-offset',
  },
} as const satisfies HaBreadcrumbTokens;
