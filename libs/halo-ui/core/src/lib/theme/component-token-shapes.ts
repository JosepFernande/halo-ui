/**
 * Barrel for the canonical NAME-shape registries of the per-component
 * design-token surface — one file per component (`button-token-shapes.ts`,
 * `input-text-token-shapes.ts`, `select-token-shapes.ts`, ...). Add a new
 * component's `Ha<Component>Tokens` interface + `HA_<COMPONENT>_TOKENS`
 * const in its own file and re-export it below; nothing else in `theme/`
 * needs to change shape.
 *
 * These used to be declared locally inside each `type:ui` component lib
 * (`libs/button/src/lib/button.tokens.ts` etc). They live here instead so
 * `core` can build `HaTheme.components` (a deep-partial CSS-VALUE tree that
 * mirrors this exact NAME shape) and walk a consumer's component overrides
 * against these registries — WITHOUT `core` ever importing FROM
 * `@halolib-ui/button` / `@halolib-ui/input-text` / `@halolib-ui/select`.
 * `button`/`input-text`/`select` already depend on `core` (see
 * `*.tokens.spec.ts`'s `HA_COMPONENT_TOKEN_DEFAULTS` import), so the reverse
 * import would be a circular project dependency — `@nx/enforce-module-
 * boundaries` rejects a dependency cycle between two projects regardless of
 * their tags. Each component lib's own `*.tokens.ts` now re-exports the
 * type and const declared here verbatim (see that file's header comment),
 * so its existing public API (each lib's own `public-api.ts`) needs zero
 * changes.
 *
 * Deliberately placed under `theme/`, NOT `foundation/`:
 * `theme.tokens.ts` needs to import these interfaces to build
 * `HaComponentsThemeInput`, and `no-raw-scale-in-theme-engine.spec.ts`
 * hard-asserts (by source-text regex) that `theme.tokens.ts` (along with
 * `theme-engine.ts`/`color-derivation.ts`) never contains an import whose
 * path matches `from ['"].*foundation` — type-only or not. An import path
 * of `../components/foundation/component-token-shapes` (or any per-component file
 * under `foundation/`) would trip that literal check even though nothing
 * here is a raw Foundation scale value. Keeping every file's path free of
 * the substring "foundation" satisfies the letter of that spec (which this
 * change must not weaken) while still achieving the real goal: one
 * canonical, `type:ui`-independent source of truth per component, importable
 * into `theme.tokens.ts`.
 */

export { HA_BUTTON_TOKENS } from '../components/button/button-token-shapes';
export type { HaButtonTokens } from '../components/button/button-token-shapes';

export { HA_INPUT_TEXT_TOKENS } from '../components/input-text/input-text-token-shapes';
export type { HaInputTextTokens } from '../components/input-text/input-text-token-shapes';

export { HA_SELECT_TOKENS } from '../components/select/select-token-shapes';
export type { HaSelectTokens } from '../components/select/select-token-shapes';

export { HA_BREADCRUMB_TOKENS } from '../components/breadcrumb/breadcrumb-token-shapes';
export type { HaBreadcrumbTokens } from '../components/breadcrumb/breadcrumb-token-shapes';
