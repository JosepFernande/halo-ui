// Node built-in test runner: `node --test tools/release/validate-packages.test.mjs`
//
// Covers two Threat Matrix items and the single-package topology contract
// introduced by the halo-ui consolidation (SDD change
// consolidate-halo-ui-single-package, Phase 3 / PR3):
//
//   1. Git repository selection / Push state (#139 S3): the "Create release
//      tag" step in release.yml must keep creating an annotated run-level tag
//      (`release-v${version}`) and pushing it with `git push origin`, in the
//      implicit checkout cwd (no `-C`/relative-path selection, no
//      `--force`/`+refs`). Post-#156 this no longer happens inside the publish
//      step, so the validator targets the dedicated tag step.
//   2. Publish-target invariant (replaces the old 5-package publish-order
//      invariant, which no longer applies now that there is exactly one
//      publishable lib): the publish step must still target
//      `dist/libs/halo-ui`, never `libs/halo-ui` (source) or
//      `changeset publish` (the #85 regression).
//   3. Single-package entry-point resolution: the dist package.json's
//      `exports` map must expose all 7 required subpaths (`.`, `./core`,
//      `./button`, `./input-text`, `./select`, `./icon`, `./breadcrumb`),
//      each with both a runtime and
//      a types entry.
//   4. No runtime cross-package dependency: the dist package.json must
//      declare zero `@halolib-ui/*` entries in `dependencies` or
//      `peerDependencies`.
//
// All four are extracted as pure functions so they are testable without
// importing (and running) the whole CLI script or touching the filesystem.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  extractStep,
  checkReleaseTagInvariant,
  checkDistPublishTargetInvariant,
  checkExportsShape,
  checkNoCrossPackageDeps,
} from './validate-packages.mjs';

const scriptPath = fileURLToPath(new URL('./validate-packages.mjs', import.meta.url));

const PUBLISH_STEP_OK = `- name: Publish to npm from dist
  id: publish
  if: steps.changesets.outputs.has_changesets == 'false'
  run: |
    name="$(node -p "require('./libs/halo-ui/package.json').name")"
    version="$(node -p "require('./libs/halo-ui/package.json').version")"

    if npm view "\${name}@\${version}" version >/dev/null 2>&1; then
      echo "skip: \${name}@\${version} already on npm"
      echo "published=false" >> "$GITHUB_OUTPUT"
    else
      npm publish "dist/libs/halo-ui" --access public
      echo "\${name}@\${version}" >> /tmp/newly_published.txt
      echo "published=true" >> "$GITHUB_OUTPUT"
    fi
- name: Next step
  run: echo done
`;

const RELEASE_TAG_STEP_OK = `- name: Create release tag
  if: steps.publish.outputs.published == 'true'
  run: |
    name="$(node -p "require('./libs/halo-ui/package.json').name")"
    version="$(node -p "require('./libs/halo-ui/package.json').version")"
    if [ -z "$version" ]; then
      echo "::error::could not derive the published version"
      exit 1
    fi
    TAG="release-v\${version}"
    git tag -a "$TAG" -m "Release \${version}"
    git push origin "$TAG"
    echo "TAG=$TAG" >> "$GITHUB_ENV"
- name: Next step
  run: echo done
`;

test('extractStep pulls exactly the named step block', () => {
  const step = extractStep(PUBLISH_STEP_OK, 'Publish to npm from dist');
  assert.match(step, /npm publish "dist\/libs\/halo-ui"/);
  assert.doesNotMatch(step, /Next step/);
});

// ----------------------------------------------------------------------
// Git tag/push invariant (#139 S3) — post-#156 the per-package tag moved
// from the publish step into the dedicated "Create release tag" step.
// ----------------------------------------------------------------------

test('checkReleaseTagInvariant passes when the step tags and pushes release-v${version}', () => {
  const step = extractStep(RELEASE_TAG_STEP_OK, 'Create release tag');
  const result = checkReleaseTagInvariant(step);
  assert.equal(result.ok, true);
});

test('checkReleaseTagInvariant fails when the release-v${version} tag definition is missing', () => {
  const stepWithoutTag = RELEASE_TAG_STEP_OK.replace(/TAG="release-v\$\{version\}"\n/, '');
  const result = checkReleaseTagInvariant(stepWithoutTag);
  assert.equal(result.ok, false);
  assert.match(result.reason, /release-v\$\{version\}/);
});

test('checkReleaseTagInvariant fails when the annotated git tag step is missing', () => {
  const stepWithoutTag = RELEASE_TAG_STEP_OK.replace(/git tag -a[^\n]*\n/, '');
  const result = checkReleaseTagInvariant(stepWithoutTag);
  assert.equal(result.ok, false);
  assert.match(result.reason, /git tag -a/);
});

test('checkReleaseTagInvariant fails when git push origin is missing', () => {
  const stepWithoutPush = RELEASE_TAG_STEP_OK.replace(/git push origin[^\n]*\n/, '');
  const result = checkReleaseTagInvariant(stepWithoutPush);
  assert.equal(result.ok, false);
  assert.match(result.reason, /git push origin/);
});

test('checkReleaseTagInvariant fails on a repo-selection escape hatch (git -C or a relative path)', () => {
  const stepWithDashC = RELEASE_TAG_STEP_OK.replace('git tag -a', 'git -C ../other tag -a');
  const result = checkReleaseTagInvariant(stepWithDashC);
  assert.equal(result.ok, false);
  assert.match(result.reason, /-C|relative path/);
});

test('checkReleaseTagInvariant fails on a force-push or refspec escape hatch', () => {
  const stepWithForce = RELEASE_TAG_STEP_OK.replace(
    'git push origin "$TAG"',
    'git push --force origin "$TAG"',
  );
  const result = checkReleaseTagInvariant(stepWithForce);
  assert.equal(result.ok, false);
  assert.match(result.reason, /--force|\+refs/);
});

// ----------------------------------------------------------------------
// Publish-target invariant (replaces the 5-package publish-order invariant —
// with exactly one publishable lib there is nothing left to order).
// ----------------------------------------------------------------------

test('checkDistPublishTargetInvariant passes when the step publishes dist/libs/halo-ui', () => {
  const step = extractStep(PUBLISH_STEP_OK, 'Publish to npm from dist');
  const result = checkDistPublishTargetInvariant(step);
  assert.equal(result.ok, true);
});

test('checkDistPublishTargetInvariant fails when the step reverts to publishing the source lib', () => {
  const stepOnSource = PUBLISH_STEP_OK.replace(
    'npm publish "dist/libs/halo-ui" --access public',
    'npm publish "libs/halo-ui" --access public',
  );
  const result = checkDistPublishTargetInvariant(stepOnSource);
  assert.equal(result.ok, false);
  assert.match(result.reason, /dist\/libs\/halo-ui/);
});

test('checkDistPublishTargetInvariant fails when the step reverts to `changeset publish`', () => {
  const stepOnChangesetPublish = PUBLISH_STEP_OK.replace(
    'npm publish "dist/libs/halo-ui" --access public',
    'npx changeset publish',
  );
  const result = checkDistPublishTargetInvariant(stepOnChangesetPublish);
  assert.equal(result.ok, false);
  assert.match(result.reason, /dist\/libs\/halo-ui/);
});

test('checkDistPublishTargetInvariant fails when the step reverts to the old 5-package $lib_dir loop', () => {
  const stepOnOldLoop = PUBLISH_STEP_OK.replace(
    'npm publish "dist/libs/halo-ui" --access public',
    'npm publish "$dist_dir" --access public',
  );
  const result = checkDistPublishTargetInvariant(stepOnOldLoop);
  assert.equal(result.ok, false);
});

// ----------------------------------------------------------------------
// Single-package entry-point resolution (spec: "Import Resolution as
// Installed npm Package" — root + 6 subpaths must all resolve with types).
// ----------------------------------------------------------------------

const REQUIRED_ENTRY_POINTS = [
  '.',
  './core',
  './button',
  './input-text',
  './select',
  './icon',
  './breadcrumb',
];

const FULL_EXPORTS_MAP = {
  './package.json': { default: './package.json' },
  '.': { default: './fesm2022/halolib-ui-angular.mjs', types: './index.d.ts' },
  './core': { default: './fesm2022/halolib-ui-angular-core.mjs', types: './core/index.d.ts' },
  './button': { default: './fesm2022/halolib-ui-angular-button.mjs', types: './button/index.d.ts' },
  './input-text': {
    default: './fesm2022/halolib-ui-angular-input-text.mjs',
    types: './input-text/index.d.ts',
  },
  './select': { default: './fesm2022/halolib-ui-angular-select.mjs', types: './select/index.d.ts' },
  './icon': { default: './fesm2022/halolib-ui-angular-icon.mjs', types: './icon/index.d.ts' },
  './breadcrumb': {
    default: './fesm2022/halolib-ui-angular-breadcrumb.mjs',
    types: './breadcrumb/index.d.ts',
  },
};

test('checkExportsShape passes when all 7 required entry points have a runtime + types entry', () => {
  const result = checkExportsShape(FULL_EXPORTS_MAP, REQUIRED_ENTRY_POINTS);
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.missingRuntime, []);
  assert.deepEqual(result.missingTypes, []);
});

test('checkExportsShape flags an entirely missing subpath (e.g. ./select dropped)', () => {
  const withoutSelect = { ...FULL_EXPORTS_MAP };
  delete withoutSelect['./select'];
  const result = checkExportsShape(withoutSelect, REQUIRED_ENTRY_POINTS);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ['./select']);
});

test('checkExportsShape flags a subpath with no runtime ("default") entry', () => {
  const brokenMap = {
    ...FULL_EXPORTS_MAP,
    './core': { types: './core/index.d.ts' },
  };
  const result = checkExportsShape(brokenMap, REQUIRED_ENTRY_POINTS);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missingRuntime, ['./core']);
  assert.deepEqual(result.missingTypes, []);
});

test('checkExportsShape flags a subpath with no "types" entry', () => {
  const brokenMap = {
    ...FULL_EXPORTS_MAP,
    './button': { default: './fesm2022/halolib-ui-angular-button.mjs' },
  };
  const result = checkExportsShape(brokenMap, REQUIRED_ENTRY_POINTS);
  assert.equal(result.ok, false);
  assert.deepEqual(result.missingTypes, ['./button']);
  assert.deepEqual(result.missingRuntime, []);
});

// ----------------------------------------------------------------------
// No runtime cross-package dependency (spec: "No Runtime Cross-Package
// Dependencies").
// ----------------------------------------------------------------------

test('checkNoCrossPackageDeps passes for a dist package.json with only tslib as a dependency', () => {
  const result = checkNoCrossPackageDeps({ dependencies: { tslib: '^2.3.0' } });
  assert.equal(result.ok, true);
  assert.deepEqual(result.offenders, []);
});

test('checkNoCrossPackageDeps fails when a stale @halolib-ui/* dependency is present', () => {
  const result = checkNoCrossPackageDeps({
    dependencies: { tslib: '^2.3.0', '@halolib-ui/core': '19.0.0' },
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.offenders, ['@halolib-ui/core']);
});

test('checkNoCrossPackageDeps fails when a stale @halolib-ui/* peerDependency is present', () => {
  const result = checkNoCrossPackageDeps({
    peerDependencies: { '@angular/core': '^19.2.0', '@halolib-ui/angular': '19.0.0' },
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.offenders, ['@halolib-ui/angular']);
});

// ----------------------------------------------------------------------
// Absence check: the 5-package publish-order invariant must be gone, not
// just unused — its presence would signal the rewrite silently kept dead
// multi-package logic instead of actually dropping it (spec: "Requirement:
// Release Tooling Validates Single-Package Topology" / scenario
// "checkPublishOrderInvariant removed").
// ----------------------------------------------------------------------

test('extractPublishOrder / checkPublishOrderInvariant are no longer exported — publish-order logic was removed, not just unused', async () => {
  const mod = await import('./validate-packages.mjs');
  assert.equal(mod.extractPublishOrder, undefined);
  assert.equal(mod.checkPublishOrderInvariant, undefined);
});

// ----------------------------------------------------------------------
// Cross-platform CLI entry-point guard. Regression test for a bug found
// while validating Phase 3: `import.meta.url === \`file://${process.argv[1]}\``
// never matches on Windows (process.argv[1] uses backslashes; import.meta.url
// is always a normalized file:/// URL), so `node
// tools/release/validate-packages.mjs` silently ran zero checks and always
// exited 0 there — a real subprocess spawn is the only way to prove the
// guard actually fires, a pure unit test of the exported functions cannot
// catch this class of bug.
// ----------------------------------------------------------------------

test('running the script directly (as CI/a developer would) actually executes its checks and prints output', () => {
  const result = spawnSync(process.execPath, [scriptPath], { encoding: 'utf8' });
  // Whether validation passes or fails depends on repo state (a real dist
  // build, an up-to-date release.yml) — that is exercised separately by
  // `npm run validate:packages` in CI/local integration runs. What this
  // regression test guarantees on every platform is that the entry-point
  // guard actually ran the CLI body instead of silently no-op'ing.
  assert.match(result.stdout, /Validating publishable packages before publish/);
});
