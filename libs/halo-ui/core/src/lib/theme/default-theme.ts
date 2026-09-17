/**
 * `HA_DEFAULT_THEME` — the single, fully-specified default theme object
 * (`foundation` + `semantic` + `components`), shaped like `HaTheme` but with
 * every field populated (no optional gaps). This is the ONE static source of
 * truth the runtime Theme Engine builds from: `foundation-overrides.ts` and
 * `component-overrides.ts` deep-merge a consumer's `HaTheme.foundation` /
 * `HaTheme.components` override over this object's matching branch and emit
 * the complete flattened CSS var map every time — the Theme Engine is now
 * the actual builder of every CSS variable every component consumes, not a
 * thin override layer sitting on a hand-maintained static stylesheet.
 *
 * Assembled from three pre-existing, unchanged sources — nothing here is a
 * new literal value:
 * - `foundation`: the raw scales from `foundation/foundation.tokens.ts`
 *   (`HA_FOUNDATION_PALETTE`, `HA_SPACING_SCALE`, `HA_GAP_SCALE`,
 *   `HA_RADIUS_SCALE`, `HA_ICON_SIZE_SCALE`, `HA_FONT_WEIGHT_SCALE`,
 *   `HA_FONT_FAMILY`, `HA_TYPOGRAPHY_SCALE`).
 * - `semantic`: `DEFAULT_THEME.colors` (`theme.tokens.ts`), kept exactly
 *   as-is — this file does NOT widen or rename `DEFAULT_THEME`.
 * - `components`: the nested value trees in each component's own
 *   `*-default-values.tokens.ts` (`button/`, `input-text/`, `select/`).
 *
 * This file is NOT one of the 3 files `foundation/no-raw-scale-in-theme-
 * engine.spec.ts` source-regex-checks for a `from ['"].*foundation` import
 * (`theme.tokens.ts`, `theme-engine.ts`, `color-derivation.ts`), so it may
 * import from `foundation/` freely. Keep it that way — do NOT let this
 * assembly logic leak into those 3 files; they must stay free of any
 * Foundation import so a raw scale can never reach `mergeTheme`/
 * `deriveTokens` (Requirement: `deriveTokens()` Never Processes Raw Scales).
 */
import { HA_BUTTON_TOKEN_DEFAULT_VALUES } from '../components/button/button-default-values.tokens';
import { HA_INPUT_TOKEN_DEFAULT_VALUES } from '../components/input-text/input-text-default-values.tokens';
import { HA_SELECT_TOKEN_DEFAULT_VALUES } from '../components/select/select-default-values.tokens';
import { HA_BREADCRUMB_TOKEN_DEFAULT_VALUES } from '../components/breadcrumb/breadcrumb-default-values.tokens';
import {
  HA_FONT_FAMILY,
  HA_FONT_WEIGHT_SCALE,
  HA_FOUNDATION_PALETTE,
  HA_GAP_SCALE,
  HA_ICON_SIZE_SCALE,
  HA_RADIUS_SCALE,
  HA_SPACING_SCALE,
  HA_TYPOGRAPHY_SCALE,
} from '../foundation/foundation.tokens';
import type {
  HaFontWeightScale,
  HaFoundationPalette,
  HaSizeScale,
  HaTypographyScale,
} from '../foundation/foundation.types';
import type {
  HaBreadcrumbTokens,
  HaButtonTokens,
  HaInputTextTokens,
  HaSelectTokens,
} from './component-token-shapes';
import { DEFAULT_THEME } from './theme.tokens';
import type { HaColorValue } from './theme.tokens';

/** The exact, fully-specified shape of `HA_DEFAULT_THEME` — no optional fields anywhere. */
export interface HaDefaultTheme {
  readonly foundation: {
    readonly palette: HaFoundationPalette;
    readonly spacing: HaSizeScale;
    readonly gap: HaSizeScale;
    readonly radius: HaSizeScale;
    readonly iconSize: HaSizeScale;
    readonly fontWeight: HaFontWeightScale;
    readonly fontFamily: string;
    readonly typography: HaTypographyScale;
  };
  readonly semantic: Record<string, HaColorValue>;
  readonly components: {
    readonly button: HaButtonTokens;
    readonly inputText: HaInputTextTokens;
    readonly select: HaSelectTokens;
    readonly breadcrumb: HaBreadcrumbTokens;
  };
}

export const HA_DEFAULT_THEME = {
  foundation: {
    palette: HA_FOUNDATION_PALETTE,
    spacing: HA_SPACING_SCALE,
    gap: HA_GAP_SCALE,
    radius: HA_RADIUS_SCALE,
    iconSize: HA_ICON_SIZE_SCALE,
    fontWeight: HA_FONT_WEIGHT_SCALE,
    fontFamily: HA_FONT_FAMILY,
    typography: HA_TYPOGRAPHY_SCALE,
  },
  semantic: DEFAULT_THEME.colors,
  components: {
    button: HA_BUTTON_TOKEN_DEFAULT_VALUES,
    inputText: HA_INPUT_TOKEN_DEFAULT_VALUES,
    select: HA_SELECT_TOKEN_DEFAULT_VALUES,
    breadcrumb: HA_BREADCRUMB_TOKEN_DEFAULT_VALUES,
  },
} as const satisfies HaDefaultTheme;
