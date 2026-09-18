# Release and Publishing

## Purpose

Defines the technical flow that takes a change from `main` to a published npm
version: how `@halolib-ui/angular` — the single consolidated package — is
versioned, signed, and distributed. This is the "why" companion to the
`lib-ui-release` skill (`skills/lib-ui-release/SKILL.md`), which owns the
day-to-day operational checklist and the historical record of release bugs
already found and fixed — this document does not repeat that checklist, only the
reasoning behind the pipeline's shape. See also
[CI/CD Pipeline](./ci-cd-pipeline.md) (the `release.yml` workflow that runs this
flow) and
[Contribution & PR Guidelines](./contribution-pr-code-review-guidelines.md)
(commits, changesets, branch process).

**Single-package topology (as of the `consolidate-halo-ui-single-package` SDD
change):** `@halolib-ui/core`, `@halolib-ui/button`, `@halolib-ui/input-text`,
`@halolib-ui/select`, and the old `@halolib-ui/angular` umbrella no longer
publish. `libs/halo-ui` (npm name `@halolib-ui/angular`) is now the only
publishable Nx project, built by ng-packagr with secondary entry points
(`@halolib-ui/angular/core`, `.../button`, `.../input-text`, `.../select`,
`.../icon`, `.../breadcrumb`). It reset to a fixed `19.0.0` at consolidation,
aligned with the Angular major version it targets — do not assume version
continuity with the 4 legacy packages' last published versions. The current
version is `19.2.0`. This document has been rewritten for that topology;
sections below describing "the four packages" or a `fixed` changesets group
describe the pre-consolidation history, called out explicitly where still
relevant.

## Current Release Mode: Stable (Not Prerelease)

`.changeset/pre.json` does not exist in the repo — installing
`@halolib-ui/angular` with a bare `npm install @halolib-ui/angular` resolves the
real `latest` stable version, no `alpha`/`beta`/`next` dist-tag involved. The
repo previously ran in Changesets' prerelease (`pre`) mode, which is historical
context the `lib-ui-release` skill still documents — but `changeset pre exit`
has since run, and `pre.json` is gone.

`release.yml` retains conditional branches for `.changeset/pre.json` (the
`alpha` dist-tag step, marking the GitHub Release as `prerelease`). Those
branches are dormant, not deleted, in case the project re-enters prerelease mode
for a specific future initiative — they do not currently execute.

<!-- TODO(verify): whether the project intends to ever re-enter
prerelease mode is a product decision, not something the code or workflow
history can confirm. -->

## npm Account & Scope Setup

Before any publish can happen, three things must be ready on the npm side.

### 1. npm organization

The `@halolib-ui` npm scope needs an organization. Options:

- **Personal scope** — `npm login`, then
  `npm access set scope @halolib-ui restricted`. Anyone with publish rights on
  the org can publish.
- **Team scope** — create an npm organization named `halo-ui`. Add members,
  assign the "Developer" role to anyone who can publish.

**Recommendation:** start with a personal scope, migrate to a team scope once a
second maintainer joins.

### 2. Two-Factor Authentication (2FA)

Required by npm to publish. Use an authenticator app, not SMS (npm is
deprecating SMS 2FA). CI does **not** need 2FA because it uses a different
mechanism (see Trusted Publishing below).

### 3. The `@halolib-ui` scope

Declared in `libs/halo-ui/package.json` via `name: "@halolib-ui/angular"`. The
very first version must be published manually
(`npm login && npm publish --access public`, run once from `dist/libs/halo-ui`
after `nx build halo-ui --configuration=production`); every subsequent publish
goes through CI.

## Trusted Publishing (OIDC) — the Modern Approach

The recommended mechanism for publishing from CI. Replaces long-lived npm tokens
with short-lived OIDC tokens, removing the biggest security risk in npm
publishing.

**How it works:** GitHub Actions generates a short-lived OIDC token per workflow
run; npm verifies it against a configured "trusted publisher" rule (matching
repo, workflow, and environment); if it matches, npm allows the publish; the
token expires in minutes, so there's no long-lived secret that can leak.

**Setup (one-time, by the maintainer):** in npm's package settings → Trusted
publishers → Add trusted publisher, with repository owner/name set to this repo,
workflow filename `release.yml`, and an optional GitHub Environment name for an
extra gate. Configured once for the single `@halolib-ui/angular` package (or
org-wide if the scope belongs to an org).

**Current state: still on a classic token, not OIDC.** `release.yml`'s
`permissions: id-token: write` is declared, but the actual
`npm publish "dist/libs/halo-ui" --access public` step does not pass
`--provenance`, and CI authenticates via
`NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` (verified: `NPM_TOKEN` exists in the
repo's configured secrets). Trusted Publishing is a migration target, not the
current mechanism — no npm provenance attestation is generated today despite the
`id-token: write` permission being present.

## Changesets in Practice

The [Contribution guide](./contribution-pr-code-review-guidelines.md) and the
`lib-ui-release` skill cover the day-to-day changeset workflow (when to add one,
the CLI flow, bump types). This section covers the operational mechanics behind
it.

### Where changesets live

`.changeset/*.md` files at the repo root, one per change. Since there is now
exactly one publishable package, a changeset only ever names one package.

### File format

```markdown
---
'@halolib-ui/angular': minor
---

Add the `size` input to the button component.
```

Frontmatter: one line naming `@halolib-ui/angular` with its SemVer bump type.
`.changeset/config.json`'s `fixed` group is `[]` — a `fixed`/`linked` group made
sense pre-consolidation, when a changeset touching one of 4 sibling packages
needed all of them to bump in lockstep; with a single package it is moot.

## Package Configuration

`libs/halo-ui/package.json` needs specific fields for npm publishing:

```json
{
  "name": "@halolib-ui/angular",
  "version": "19.2.0",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/JosepFernande/halo-ui",
    "directory": "libs/halo-ui"
  },
  "bugs": { "url": "https://github.com/JosepFernande/halo-ui/issues" },
  "homepage": "https://github.com/JosepFernande/halo-ui#readme",
  "publishConfig": { "access": "public" },
  "exports": {
    "./package.json": { "default": "./package.json" },
    ".": { "default": "./src/index.ts" },
    "./core": { "default": "./core/src/index.ts" },
    "./button": { "default": "./button/src/index.ts" },
    "./input-text": { "default": "./input-text/src/index.ts" },
    "./select": { "default": "./select/src/index.ts" },
    "./icon": { "default": "./icon/src/index.ts" },
    "./breadcrumb": { "default": "./breadcrumb/src/index.ts" }
  },
  "peerDependencies": {
    "@angular/common": "^19.2.0",
    "@angular/core": "^19.2.0",
    "@angular/cdk": "^19.2.0",
    "@angular/forms": "^19.2.0"
  }
}
```

The `exports` map above is the source-level map (points at `.ts` files, used for
in-repo/Nx resolution). ng-packagr overwrites it with real dist paths
(`fesm2022/halolib-ui-angular[-<entry>].mjs` + per-entry `.d.ts`) in the
package.json it emits under `dist/libs/halo-ui/`.

### Generated by ng-packagr

`libs/halo-ui` is now built by `@nx/angular:package` (real ng-packagr, with
secondary entry points for
`core`/`button`/`input-text`/`select`/`icon`/`breadcrumb`) — the umbrella
package's prior hand-maintained `nx:run-commands` copy
(`tools/release/build-halo-ui.mjs`, deleted in the same change) is gone. The
release build command is:

```bash
npx nx build halo-ui --configuration=production
```

This produces the publishable package under `dist/libs/halo-ui/`. Most of the
dist `package.json` is auto-generated by ng-packagr: `main`, `module`,
`typings`, per-entry-point `exports` (subpath exports for tree-shaking),
`sideEffects: false`, and `peerDependencies` copied from the source
`package.json`.

### How the README gets into the published package

`ng-packagr` does not copy `README.md` into `dist/` by default.
`libs/halo-ui/ng-package.json` declares it as an explicit asset:

```json
"assets": [{ "glob": "README.md", "input": ".", "output": "." }]
```

**No `package.json` in this repo uses a `files` field** — the `assets` entry
above is how the README reaches the published tarball, not `files`.

## Release Flow (End to End)

```
1. Dev opens PR with code change + .changeset/<name>.md
   ↓
2. CI runs (lint, stylelint, test, build, audit, gga-review) — must pass
   ↓
3. PR approved and merged to main
   ↓
4. release.yml triggers on push to main (paths: libs/**, .changeset/**, package.json, package-lock.json, .github/workflows/release.yml)
   ↓
5. release.yml checks: are there new .changeset/*.md files?
   │
   ├─ NO  → continues to build/audit/validate/publish in the same run
   │
   └─ YES → continue ↓
   ↓
6. `npx changeset version` — reads pending .changeset/*.md, bumps versions, generates CHANGELOG entries
   ↓
7. Opens a "chore(release): version packages" PR (peter-evans/create-pull-request) — does not commit directly to main
   ↓
8. Enables auto-merge on that PR (`gh pr merge --auto --squash`)
   ↓
9. release.yml polls the PR state until it merges (GitHub Actions does not trigger a new run for GITHUB_TOKEN pushes, so the same run must continue)
   ↓
10. `npx nx build halo-ui --configuration=production`
   ↓
11. `npm audit` (advisory, non-blocking) + `npm run validate:packages` (blocking — fails the release if `dist/libs/halo-ui/package.json` lost any of the 6 required entry points or a cross-package dependency crept back in)
   ↓
12. Single publish from `dist/libs/halo-ui` with `npm publish "dist/libs/halo-ui" --access public` (not `changeset publish`) — no npm provenance active today
   ↓
13. GitHub Release created (tag `release-v<version>`, body generated by hand in the step)
```

Total time from merge to npm: **1–3 minutes**.

## Version Sync Strategy: Single Package

Pre-consolidation, `@halolib-ui` was a 5-package monorepo with a `fixed`
changesets group (`@halolib-ui/core`, `@halolib-ui/button`,
`@halolib-ui/input-text`, `@halolib-ui/select`, `@halolib-ui/angular` all
bumping together). The `consolidate-halo-ui-single-package` SDD change replaced
that with a single publishable package (`libs/halo-ui` → `@halolib-ui/angular`,
with `core`/`button`/`input-text`/`select`/`icon`/`breadcrumb` as ng-packagr
secondary entry points, not separate npm packages). `.changeset/config.json`'s
`fixed`/`linked` groups are both `[]` — nothing left to keep in lockstep. Every
changeset names exactly one package and bumps exactly one version.

## Dist Tags & Pre-Releases

npm uses dist tags to mark channels; the default is `latest`. For the repo's
current stable state, only `latest` is used. If the project re-enters prerelease
mode in the future, `release.yml`'s dormant branches would move a prerelease
dist-tag (e.g. `alpha`) forward instead — see "Current Release Mode" above and
the `lib-ui-release` skill for exactly how that logic behaved the last time it
was active (including why `changeset publish --tag <anything>` cannot be used in
`pre` mode at all).

## Rollback & Deprecation

Once a version is published, it cannot be unpublished after 72 hours (npm
policy). `release.yml` does not run `npm deprecate` for anything — the 4 legacy
packages (`@halolib-ui/{core,button,input-text,select}`) are being retired
manually and out of band by the maintainer, not via CI automation.

- **Deprecate (manual, preferred for a bad release of the current package):**
  `npm deprecate @halolib-ui/angular@19.0.1 "Critical bug, upgrade to 19.0.2"` —
  marks the version deprecated; it stays downloadable but installers see a
  warning.
- **Unpublish (within 72 hours, never-installed only):**
  `npm unpublish @halolib-ui/angular@19.0.1 --force` — destructive, reserved for
  security incidents or genuinely broken releases. npm is deprecating
  `unpublish` in favor of `deprecate`.
- **Fix forward (always safe):** ship a patch release through the normal flow
  (fix, changeset, PR, merge, release) — the safest path for non-critical
  issues.

## CHANGELOG Generation

Changesets auto-generates `libs/halo-ui/CHANGELOG.md` during
`changeset version`:

```markdown
# @halolib-ui/angular

## 19.1.0

### Minor Changes

- Add the `size` input to the button entry point.
  ([#12](https://github.com/JosepFernande/halo-ui/pull/12))
```

These are committed with the version bump and shipped in the npm tarball. The
`19.0.0` entry is a fresh start, not merged from the 4 legacy packages' old
per-package changelogs — see `libs/halo-ui/CHANGELOG.md` for the rationale.

## GitHub Releases

Implemented in `release.yml`'s "Create release tag" + "Create GitHub Release"
steps:

- **Tag:** `release-v<version>` — the real published version, read directly from
  `libs/halo-ui/package.json` (single package, no multi-package divergence to
  reconcile anymore).
- **Title:** `halo-ui <version>`.
- **Body:** the published package + its matching CHANGELOG entry + a link to the
  full CHANGELOG. Built by hand in the step (not via `changesets/action`, which
  was never adopted).
- **Prerelease flag:** `true` only if `.changeset/pre.json` exists with
  `mode: "pre"` at release time (the exceptional case); `false` in the normal
  case, which is the repo's current state.
- Uses `softprops/action-gh-release@v3`.

## Security & Provenance

**npm provenance:** the `id-token: write` permission in `release.yml` enables
npm provenance — a cryptographic proof that a package was built from a specific
commit of this repo — but the publish step does not pass `--provenance`, so no
attestation is actually generated today despite the permission being present.
Adding the flag is the remaining step to make this real.

**2FA and Trusted Publishing:** see the sections above.

**Dependency audit before each release:**
`npm audit --omit=dev --audit-level=critical`, non-blocking
(`continue-on-error: true`) — an advisory unrelated to the change being
published must not kill the release. The exit code is recorded as a failed step
(visible in the run) but never blocks the publish; the JSON report is uploaded
as an artifact so the finding stays actionable. This runs only when the Release
PR merged with no pending changesets, right before the publish step.

## Rules of the Team (Enforced by CI)

- Every PR that modifies published code SHOULD include a changeset — this is a
  review-time convention, not a CI-enforced gate (no changeset-bot exists
  today).
- Never run `npm publish` from a local machine for this repo. The flow is 100%
  through `release.yml`. A local `npm whoami` isn't expected to be authenticated
  — that's not something to "fix" so you can publish by hand.
- Never publish on a Friday afternoon (or when the maintainer is away) — a soft
  rule, use judgment.
- Hotfixes follow the normal flow: branch, fix, changeset, PR, merge, release.
  No skipping steps.

## Reference

- `lib-ui-release` skill (`skills/lib-ui-release/SKILL.md`) — the operational
  checklist, the prerelease-mode mechanics (historical), and the three release
  bugs already found and fixed
- [CI/CD Pipeline](./ci-cd-pipeline.md) — the `release.yml` workflow in full
- [Contribution & PR Guidelines](./contribution-pr-code-review-guidelines.md) —
  when to add a changeset, commit conventions
- `.github/workflows/release.yml` — the real workflow
- `.changeset/config.json` — `fixed`/`linked` are both `[]` (single package)
