---
name: lib-ui-version-align
description:
  'Trigger: PR, release, version, showcase, @halolib-ui/angular, align version.
  Keep the showcase landing page LIBRARY_VERSION constant aligned with the
  publishable library version in libs/halo-ui/package.json.'
license: MIT
metadata:
  author: JosepFernande
  version: '1.0'
  project: halo-ui
---

## Activation Contract

Load this skill when creating or reviewing PRs that can drift the showcase
version away from the publishable library version: changes to
`libs/halo-ui/package.json`, `apps/showcase/**`, release/tooling files
(`.github/workflows/release.yml`, `.github/workflows/ci.yml`), or the scripts
under `tools/release/`.

## Execution Steps

1. Compare the version in `libs/halo-ui/package.json` with the
   `protected static readonly LIBRARY_VERSION` constant in
   `apps/showcase/src/app/pages/home-page/home-page.component.ts`.
2. If they differ, run `npm run sync:showcase-version` and commit the result.
3. Before finishing any release-related PR, ensure
   `npm run validate:showcase-version` passes locally.

## Checks

- `npm run validate:showcase-version` exits 0 when the versions match.
- `npm run sync:showcase-version` writes the showcase file only if it changed.

## References

- Library package: `libs/halo-ui/package.json`
- Showcase constant: `apps/showcase/src/app/pages/home-page/home-page.component.ts`
- Sync script: `tools/release/sync-showcase-version.mjs`
- Validation script: `tools/release/validate-showcase-version.mjs`
- Release skill: `skills/lib-ui-release/SKILL.md`
