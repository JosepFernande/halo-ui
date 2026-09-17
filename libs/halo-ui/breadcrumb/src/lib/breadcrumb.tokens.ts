/**
 * `HaBreadcrumbTokens` and its matching `HA_BREADCRUMB_TOKENS` CSS-variable-name
 * registry now live in `@halolib-ui/angular/core` (`component-token-shapes.ts`)
 * so `core` can build `HaTheme.components.breadcrumb` and walk a consumer's
 * Breadcrumb overrides against this exact registry without importing FROM
 * `@halolib-ui/angular/breadcrumb` — `breadcrumb` already depends on `core`
 * (`breadcrumb.tokens.spec.ts` imports `HA_COMPONENT_TOKEN_DEFAULTS` from it),
 * so the reverse import would be an entry-point cycle.
 *
 * Re-exported here verbatim so this file — and therefore
 * `libs/halo-ui/breadcrumb/src/index.ts`'s existing
 * `export { HA_BREADCRUMB_TOKENS } from './lib/breadcrumb.tokens';` /
 * `export type { HaBreadcrumbTokens } from './lib/breadcrumb.tokens';` —
 * keeps working with zero further changes.
 */
export { HA_BREADCRUMB_TOKENS } from '@halolib-ui/angular/core';
export type { HaBreadcrumbTokens } from '@halolib-ui/angular/core';
