/**
 * Full CSS-variable builder for the Component layer. Deep-merges a
 * consumer's `HaTheme.components` override over `HA_DEFAULT_THEME.components`
 * and emits the COMPLETE flattened `--ha-{component}-*` custom-property map
 * every time — not just the overridden subset. The Component layer is now
 * built by the runtime Theme Engine on every write
 * (`HaThemeService.writeToDom()`) instead of being shipped as a
 * hand-authored static stylesheet.
 *
 * Same pure-function, zero-`@angular/*`, `TestBed`-free style as
 * `color-derivation.ts`/`semantic-tokens.ts`. Walks a consumer's
 * `button`/`inputText`/`select` override tree — and separately,
 * `HA_DEFAULT_THEME.components`'s matching value tree — alongside
 * `HA_BUTTON_TOKENS`/`HA_INPUT_TEXT_TOKENS`/`HA_SELECT_TOKENS` (the
 * CSS-variable-NAME registries, imported from the same-lib
 * `component-token-shapes.ts` — never from `@halolib-ui/button` etc, which
 * would be a `type:ui` -> `type:core` -> `type:ui` cycle). Deliberately never
 * imports `color-derivation.ts` — a component value is an opaque CSS value
 * string (e.g. `'var(--ha-primary)'`, `'#00897b'`, `'1px solid red'`), never
 * a semantic color routed through hex/HSL derivation.
 */
import {
  HA_BREADCRUMB_TOKENS,
  HA_BUTTON_TOKENS,
  HA_INPUT_TEXT_TOKENS,
  HA_SELECT_TOKENS,
} from './component-token-shapes';
import { HA_DEFAULT_THEME } from './default-theme';
import type { HaComponentsThemeInput, ThemeCssVariables } from './theme.tokens';

/** Defensive: is `value` a plain, non-array, non-null object? */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Recursively walks `tree` (either a component's FULL default value tree, or
 * a consumer's deep-partial override subtree) alongside `registry` (the
 * matching subtree of a `HA_*_TOKENS` NAME registry), writing
 * `{ [registryLeaf]: treeLeaf }` into `result` for every string leaf present
 * in `tree`. `toComponentCssVariables` calls this twice per component — once
 * with the full default value tree (emits every leaf) and once with the
 * consumer's override (re-emits only the overridden leaves on top) — so one
 * walk implementation serves both "flatten everything" and "flatten only
 * what changed". Also reused as-is by
 * `foundation/component-defaults.tokens.ts` to flatten
 * `component-default-values.tokens.ts` into the permanent flat
 * `HA_COMPONENT_TOKEN_DEFAULTS` export. A shape mismatch (a leaf in `tree`
 * with no matching registry entry, or vice versa) is silently skipped —
 * defensive, not warned, since a well-typed caller can never produce one;
 * only a consumer bypassing the type system (plain JS, `any`) could.
 */
export function flattenComponentTokenTree(
  tree: Record<string, unknown>,
  registry: Record<string, unknown>,
  result: ThemeCssVariables,
): void {
  for (const [key, treeValue] of Object.entries(tree)) {
    if (treeValue === undefined) {
      continue;
    }
    const registryValue = registry[key];
    if (registryValue === undefined) {
      continue;
    }
    if (typeof registryValue === 'string') {
      if (typeof treeValue === 'string') {
        result[registryValue] = treeValue;
      }
      continue;
    }
    if (isPlainObject(registryValue) && isPlainObject(treeValue)) {
      flattenComponentTokenTree(treeValue, registryValue, result);
    }
  }
}

/**
 * Converts a `HaComponentsThemeInput` (or `undefined`) into the COMPLETE flat
 * `ThemeCssVariables` map for every `--ha-button-*`/`--ha-input-*`/
 * `--ha-select-*` custom property: `HA_DEFAULT_THEME.components`'s matching
 * branch flattened first, then the consumer's override (if any) flattened
 * again on top, so an overridden leaf wins and every other leaf still gets
 * its default. Never throws.
 */
export function toComponentCssVariables(
  input: HaComponentsThemeInput | undefined,
): ThemeCssVariables {
  const result: ThemeCssVariables = {};
  const defaults = HA_DEFAULT_THEME.components;

  flattenComponentTokenTree(defaults.button, HA_BUTTON_TOKENS, result);
  flattenComponentTokenTree(defaults.inputText, HA_INPUT_TEXT_TOKENS, result);
  flattenComponentTokenTree(defaults.select, HA_SELECT_TOKENS, result);
  flattenComponentTokenTree(defaults.breadcrumb, HA_BREADCRUMB_TOKENS, result);

  if (!input) {
    return result;
  }

  if (isPlainObject(input.button)) {
    flattenComponentTokenTree(input.button, HA_BUTTON_TOKENS, result);
  }
  if (isPlainObject(input.inputText)) {
    flattenComponentTokenTree(input.inputText, HA_INPUT_TEXT_TOKENS, result);
  }
  if (isPlainObject(input.select)) {
    flattenComponentTokenTree(input.select, HA_SELECT_TOKENS, result);
  }
  if (isPlainObject(input.breadcrumb)) {
    flattenComponentTokenTree(input.breadcrumb, HA_BREADCRUMB_TOKENS, result);
  }

  return result;
}
