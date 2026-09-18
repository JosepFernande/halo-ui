---
name: lib-ui-release
description:
  'Trigger: hacer un release, publicar a npm, por qué no se publicó, trabajar
  con .changeset/, revisar el workflow release.yml. Checklist operativo para el
  pipeline de release de halo-ui, validar paquetes antes del publish
  (validate-packages).'
license: MIT
metadata:
  author: JosepFernande
  version: '1.3'
  project: halo-ui
---

## Activation Contract

Load this skill before touching anything related to releasing or publishing
`halo-ui` packages (renamed from their original npm scope in #139):
creating/reviewing a changeset, diagnosing why a package didn't reach npm, or
modifying `.github/workflows/release.yml`. The pipeline has non-obvious behavior
around changeset consumption and where packages actually get published from —
already caused confusion twice — read this before assuming the workflow is
broken or that a manual `npm publish` is the fix.

## The real flow (two merges, not one)

Merging a PR with a changeset does **not** publish anything by itself:

1. PR with a `.changeset/*.md` file merges to `main` → `release.yml` runs →
   `changeset version` bumps versions/changelogs → opens an automated
   **"chore(release): version packages"** PR.
2. That version-packages PR must be reviewed and merged manually — it does not
   merge itself.
3. Merging it triggers `release.yml` again. Only now does it validate the
   packages, `npm publish` the build output (not `changeset publish` — see the
   #85 bug below), create a git tag, and publish a GitHub Release.

If a changeset PR was merged and nothing got published, the first thing to check
is whether the version-packages PR exists and got merged:

```bash
gh pr list --state all --search "version packages" --json number,state,mergedAt
```

## Single-package topology (post `consolidate-halo-ui-single-package`)

`@halolib-ui/core`, `@halolib-ui/button`, `@halolib-ui/input-text`, and
`@halolib-ui/select` no longer publish — those 4 Nx projects were deleted.
`libs/halo-ui` (npm name `@halolib-ui/angular`) is the only publishable project,
built by ng-packagr with secondary entry points (`@halolib-ui/angular/core`,
`.../button`, `.../input-text`, `.../select`). The legacy 4 packages' last
published versions remain on npm and are being removed manually by the
maintainer, out of band — `release.yml` does not run `npm deprecate` for them
(an explicit decision: no automated deprecation step).
`.changeset/config.json`'s `fixed`/`linked` groups are both `[]` — there is
nothing left to keep in lockstep.

## Current release mode: stable (not prerelease)

The repo exited Changesets' prerelease mode on 2026-08-04 (`c8891bc` "salir del
modo pre de changesets", consolidated by `ee53fbd`). `.changeset/pre.json` no
longer exists. `@halolib-ui/angular` reset to a fixed `19.0.0` at consolidation
— chosen to align with the Angular major version it targets (Angular 19.2), not
derived from the legacy packages' last version (`19.0.1`) or bumped further. Do
not assume version continuity with the pre-consolidation history. It publishes
under npm's default `latest` tag — there is no `alpha` tag in the current stable
state.

`release.yml` still carries two branches gated on `.changeset/pre.json` existing
(the `Check for changesets` step's array-diff, and the
`Point the alpha dist-tag` step) in case the project re-enters prerelease mode
for a future initiative. Both are self-documenting inline in the workflow — if
`.changeset/pre.json` reappears, read those comments directly instead of
re-deriving the mechanics; don't assume they're dead code to delete.

## Verifying a publish actually happened

Don't trust "the workflow ran green" alone — `has_changesets == true` makes the
job skip publish/tag/release steps without failing. Confirm directly:

```bash
gh run list --workflow=release.yml --limit 3 --json databaseId,conclusion,createdAt
npm view @halolib-ui/angular dist-tags --json   # `latest` should point at the new version
gh release list --limit 5                  # a GitHub Release should exist for the new tag
```

## A bug already found and fixed here — don't reintroduce it

`changeset publish` discovers packages via root `workspaces` (`["libs/*"]`), so
it once published each lib's SOURCE `package.json` — the one `ng-packagr` never
touches — instead of the real build output in `dist/{projectRoot}`. Source
publishes have no `main`/`module`/`exports`/`typings`, so every consumer import
failed with a `TS2307: Cannot find module` error for the button package (still
published under the pre-#139 npm scope at the time of #85). This shipped broken
to npm for two releases before being caught (see "Post-publish consumer
verification" below — that check exists because of this exact bug). Fixed (#85)
by replacing `npx changeset publish` with a direct `npm publish "$dist_dir"`
step. Post-consolidation (`consolidate-halo-ui-single-package`), that step is a
single straight-line publish of `dist/libs/halo-ui` — there is no per-package
loop left, since `@halolib-ui/angular` is the only publishable package. It is
now built by real ng-packagr (`@nx/angular:package`, with secondary entry
points), not a hand-maintained `nx:run-commands` copy — the old
`tools/release/build-halo-ui.mjs` script that did that copy is deleted. See
`validate-packages` below, which catches the #85 regression class automatically
for every entry point.

## Pre-publish validation (issue #78) — `validate-packages`

`release.yml` runs **`Validate packages before publish`** inside the
`has_changesets == 'false'` branch, right before `Publish to npm from dist`. It
blocks the publish (exit != 0) instead of letting a broken package ship green.
Local command: `npm run validate:packages` (run after `nx build`, before opening
a PR with a changeset).

It enforces the guarantees that would have caught the #85 regression, rewritten
for the single-package topology:

1. **Exactly one publishable lib exists** under `libs/*`
   (`publishConfig.access === "public"`) — `libs/halo-ui`.
2. **All 5 entry points exist in what actually gets published.** The dist
   `package.json` at `dist/libs/halo-ui/package.json` must expose an `exports`
   entry for `.`, `./core`, `./button`, `./input-text`, and `./select`, each
   with both a runtime (`default`) entry and a `types` entry, and every
   referenced file must resolve on disk (a publishable lib with no dist build
   fails too).
3. **No stale cross-package dependency.** The dist package.json must declare
   zero `@halolib-ui/*` entries in `dependencies`/`peerDependencies` — a
   leftover reference to one of the 4 deleted sibling packages would mean the
   consolidated build still depends on something that no longer publishes.
4. **The validated directory is the published directory.** The script parses
   `.github/workflows/release.yml`, extracts the `Publish to npm from dist`
   step, and asserts it still targets `dist/libs/halo-ui`. If that step ever
   points back at the source (`libs/halo-ui`) or reverts to `changeset publish`
   (the old workspaces-based source publish), validation fails explicitly — no
   silent PASS on a dist/ nobody publishes.

## Post-publish consumer verification (do this for every release, not just when something looks wrong)

A green `release.yml` run and a `latest` dist-tag pointing at the new version
are **necessary but not sufficient**. The dist-vs-source bug above published
green for two releases while being completely unusable — nothing in the pipeline
ever installed the package and tried to use it. Two more real bugs (#88) were
found the same way (against the button package under the pre-#139 npm scope —
the same class of bug applies verbatim to the `@halolib-ui/angular/button` entry
point today): the `loading` input rejects the bare-attribute usage its own
README documents. (A third historical bug in this same class — a README never
mentioning that the Foundation stylesheet had to be imported separately, or the
button rendered with correct colors but no padding/height/font/gap/radius — no
longer applies: the Theme Engine now writes every design token, Foundation and
Component included, at runtime via `provideHaTheme()` alone, so there is no
separate static stylesheet to forget.)

The pre-publish harness above checks entry points and the publish-directory
invariant. It intentionally does NOT cover runtime/API/docs correctness — the
#88 class — so still do this by hand as part of reviewing any release (the
version-packages PR merge, or right after `release.yml` finishes publishing):

```bash
# 1. The tarball must contain the ng-packagr build, not source, for every
#    entry point (root + core + button + input-text + select)
npm pack @halolib-ui/angular@<new-version>
tar -tzf halolib-ui-angular-<new-version>.tgz   # expect fesm2022/*.mjs + *.d.ts, NOT src/*.ts
tar -xzOf halolib-ui-angular-<new-version>.tgz package/package.json \
  | jq '{main, module, exports, typings}'  # must be non-null/populated, 5 subpaths present

# 2. No stale @halolib-ui/* dependency should have crept back in
npm view @halolib-ui/angular@<new-version> dependencies --json

# 3. A REAL consumer must actually build against it — not just resolve it.
#    In a scratch Angular app (or a disposable one kept around for this):
npm install @halolib-ui/angular@<new-version>
npx ng build   # or ng serve — TS2307 here means the dist-vs-source bug regressed
```

For anything touching the button entry point specifically, also render it with
every documented attribute from `libs/halo-ui/button/README.md` verbatim
(including `provideHaTheme()` with no extra setup, imported from
`@halolib-ui/angular/core`) and confirm computed styles actually show
non-default padding/height/font — not just that it compiles. A component that
compiles but renders unstyled is exactly what bug from #88 looked like: no error
anywhere, just a button that "looks almost right."

## Never publish manually

Never run `npm publish` from a local machine for this repo. The flow is 100%
through `release.yml` with `NPM_TOKEN`. A local `npm whoami` isn't even expected
to be authenticated — that's not something to "fix" so you can publish by hand.
