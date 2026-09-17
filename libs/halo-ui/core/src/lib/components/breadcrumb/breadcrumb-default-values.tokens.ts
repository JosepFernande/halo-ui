import type { HaBreadcrumbTokens } from './breadcrumb-token-shapes';
import { HA_GAP_SCALE } from '../../foundation/foundation.tokens';

/** Default values for every `--ha-breadcrumb-*` design token, shaped like `HaBreadcrumbTokens`. */
export const HA_BREADCRUMB_TOKEN_DEFAULT_VALUES = {
  typography: {
    fontFamily: 'var(--font-family)',
    fontWeight: 'var(--font-weight-regular)',
    lineHeight: 'var(--line-height-small-body)',
  },

  sizing: {
    fontSm: 'var(--font-size-caption)',
    fontMd: 'var(--font-size-small-body)',
    fontLg: 'var(--font-size-body)',
    gapSm: HA_GAP_SCALE.sm,
    gapMd: HA_GAP_SCALE.md,
    gapLg: HA_GAP_SCALE.lg,
  },

  color: {
    linkColor: 'var(--ha-primary)',
    linkHoverColor: 'var(--ha-primary-hover)',
    currentColor: 'var(--neutral-900)',
    separatorColor: 'var(--neutral-500)',
  },

  focus: {
    focusRing: '2px solid var(--ha-primary-hover)',
    focusRingOffset: '2px',
  },

  surface: {
    overlayBg: 'var(--neutral-50)',
    overlayBorder: '1px solid var(--neutral-200)',
    overlayRadius: 'var(--radius-sm)',
    overlayShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    overlayPaddingY: 'var(--gap-sm)',
    overlayOffset: 'var(--gap-sm)',
  },
} as const satisfies HaBreadcrumbTokens;
