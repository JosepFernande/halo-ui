# @halolib-ui/angular

## 19.2.0

### Minor Changes

- fbdbf42: Add the `ha-breadcrumb` component (tokens, icon support, and an
  overlay-based collapse for long trails), extend `ha-icon` with `strokeWidth`,
  `nonScalingStroke`, and `title` inputs, and give `ha-select`'s trigger a
  rotating chevron icon whose click now toggles the panel open/closed instead of
  only opening it.

## 19.1.0

### Minor Changes

- 5bd1bdc: Realign the published version past 19.0.1, which was published and
  then unpublished during the halo-ui rebrand and can never be reused (npm
  permanently blocks republishing an unpublished name@version). A minor bump
  avoids colliding with any other version number npm may still be tracking in
  the 19.0.x range.

## 19.0.1

### Patch Changes

- d373723: Relocate the button/input-text/select default-values and token-shape
  files under `core/src/lib/components/**` (no logic changes) and register the
  `@halolib-ui/angular/icon` path mapping so the new icon entry point resolves
  correctly for consumers and in local dev.

## 19.0.0

Initial release of the consolidated `@halolib-ui/angular` package (SDD change
`consolidate-halo-ui-single-package`). Replaces the 5-package umbrella
(`@halolib-ui/core`, `@halolib-ui/button`, `@halolib-ui/input-text`,
`@halolib-ui/select`, `@halolib-ui/angular`) with one published package and
ng-packagr secondary entry points (`@halolib-ui/angular/core`,
`@halolib-ui/angular/button`, `@halolib-ui/angular/input-text`,
`@halolib-ui/angular/select`). The root import keeps working unchanged.

Per an explicit maintainer decision, this CHANGELOG starts fresh — the 4 legacy
packages' history is not merged in. The project has no stable consumers yet, so
backward-compatibility/changelog continuity does not apply. Version `19.0.0` was
chosen to align with the Angular major version this package targets (Angular
19.2), following the Angular Material/CDK convention of matching Angular's major
version.
