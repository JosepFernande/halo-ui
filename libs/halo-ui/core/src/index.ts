export { provideHaTheme } from './lib/theme/theme-provider';
export { HaThemeService } from './lib/theme/theme.service';
export { DEFAULT_THEME } from './lib/theme/theme.tokens';
export type {
  HaColorValue,
  HaColorVariants,
  HaComponentsThemeInput,
  HaDeepPartial,
  HaFoundationThemeInput,
  HaTheme,
  HaThemeOptions,
  ResolvedTheme,
  ThemeCssVariables,
} from './lib/theme/theme.tokens';

export {
  HA_BUTTON_TOKENS,
  HA_INPUT_TEXT_TOKENS,
  HA_SELECT_TOKENS,
  HA_BREADCRUMB_TOKENS,
} from './lib/theme/component-token-shapes';
export type {
  HaButtonTokens,
  HaInputTextTokens,
  HaSelectTokens,
  HaBreadcrumbTokens,
} from './lib/theme/component-token-shapes';

export {
  hexToRgb,
  rgbToHsl,
  hslToRgb,
  hexToHsl,
  hslToHex,
  relativeLuminance,
} from './lib/theme/color-math';
export type { HSL, RGB } from './lib/theme/color-math';

export {
  normalizeColorName,
  adjustLightness,
  getContrastColor,
  deriveTokens,
} from './lib/theme/color-derivation';

export { toSemanticCssVariables } from './lib/theme/semantic-tokens';

export { HA_COLOR_SCALE_STEPS, HA_SIZE_STEPS } from './lib/foundation/foundation.types';
export type {
  HaColorScale,
  HaColorScaleStep,
  HaFontWeightScale,
  HaFoundationPalette,
  HaPartialColorScale,
  HaSizeScale,
  HaSizeStep,
  HaTypographyRole,
  HaTypographyScale,
} from './lib/foundation/foundation.types';

export {
  HA_FONT_FAMILY,
  HA_FONT_WEIGHT_SCALE,
  HA_FOUNDATION_PALETTE,
  HA_GAP_SCALE,
  HA_ICON_SIZE_SCALE,
  HA_PADDING_X_SCALE,
  HA_RADIUS_SCALE,
  HA_SPACING_SCALE,
  HA_TYPOGRAPHY_SCALE,
} from './lib/foundation/foundation.tokens';

export { HA_BUTTON_DIMENSIONS } from './lib/components/button/button-default-values.tokens';
export { HA_ICON_SIZE_PX } from './lib/components/icon/icon-default-values.tokens';

export { HA_COMPONENT_TOKEN_DEFAULTS } from './lib/foundation/component-defaults.tokens';

export { withFocusMonitor } from './lib/focus/with-focus-monitor';
