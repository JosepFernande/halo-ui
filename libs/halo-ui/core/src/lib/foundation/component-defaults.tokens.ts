/**
 * Component-level token DEFAULTS as a permanent, FLAT `--var-name` -> value
 * map (Requirement: consumer imports `provideHaTheme()`, zero authored
 * tokens). Every value is a CSS-valid string: either a literal, or a
 * `var(--x)` reference into the foundation (unprefixed) or semantic
 * (`--ha-*`) color layer.
 *
 * `HA_COMPONENT_TOKEN_DEFAULTS` itself stays flat and exported exactly as
 * before — `button.tokens.spec.ts`/`input-text.tokens.spec.ts`/
 * `select.tokens.spec.ts` hard-depend on `Object.keys(HA_COMPONENT_TOKEN_DEFAULTS)`
 * with flat CSS-var-name keys — but its CONSTRUCTION now flattens the nested
 * per-component `*-default-values.tokens.ts` value trees (`button/`,
 * `input-text/`, `select/`) via the same `flattenComponentTokenTree()`
 * walk-style helper `theme/component-overrides.ts` uses for the runtime
 * Component-layer builder, so there is one source of truth (the nested value
 * trees) instead of two independently-authored literals.
 */
import { flattenComponentTokenTree } from '../theme/component-overrides';
import {
  HA_BREADCRUMB_TOKENS,
  HA_BUTTON_TOKENS,
  HA_INPUT_TEXT_TOKENS,
  HA_SELECT_TOKENS,
} from '../theme/component-token-shapes';
import type { ThemeCssVariables } from '../theme/theme.tokens';
import { HA_BUTTON_TOKEN_DEFAULT_VALUES } from '../components/button/button-default-values.tokens';
import { HA_INPUT_TOKEN_DEFAULT_VALUES } from '../components/input-text/input-text-default-values.tokens';
import { HA_SELECT_TOKEN_DEFAULT_VALUES } from '../components/select/select-default-values.tokens';
import { HA_BREADCRUMB_TOKEN_DEFAULT_VALUES } from '../components/breadcrumb/breadcrumb-default-values.tokens';

function buildComponentTokenDefaults(): ThemeCssVariables {
  const result: ThemeCssVariables = {};
  flattenComponentTokenTree(HA_BUTTON_TOKEN_DEFAULT_VALUES, HA_BUTTON_TOKENS, result);
  flattenComponentTokenTree(HA_INPUT_TOKEN_DEFAULT_VALUES, HA_INPUT_TEXT_TOKENS, result);
  flattenComponentTokenTree(HA_SELECT_TOKEN_DEFAULT_VALUES, HA_SELECT_TOKENS, result);
  flattenComponentTokenTree(HA_BREADCRUMB_TOKEN_DEFAULT_VALUES, HA_BREADCRUMB_TOKENS, result);
  return result;
}

export const HA_COMPONENT_TOKEN_DEFAULTS: Readonly<Record<string, string>> =
  buildComponentTokenDefaults();
