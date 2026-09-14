#!/usr/bin/env node
/**
 * Pre-publish package validation harness (issue #78, rewritten for the
 * single-package consolidation — SDD change
 * consolidate-halo-ui-single-package, Phase 3 / PR3).
 *
 * Guards the #85 regression class: publishing SOURCE (libs/halo-ui) instead
 * of the real ng-packagr output under dist/libs/halo-ui, which ships with no
 * main/exports/typings and breaks every consumer import with TS2307. CI
 * stayed green end to end when this happened before.
 *
 * Post-consolidation there is exactly ONE publishable Nx project
 * (`libs/halo-ui`, npm name `@halolib-ui/angular`) with 4 ng-packagr
 * secondary entry points (core, button, input-text, select) instead of 5
 * separate publishable libs. The old publish-order invariant
 * (`extractPublishOrder`/`checkPublishOrderInvariant`) is gone — there is
 * nothing left to order.
 *
 * Checks:
 *   1. Exactly one publishable lib exists under libs/* (publishConfig.access
 *      === "public").
 *   2. Its dist/libs/halo-ui/package.json exposes all 5 required export
 *      entries (`.`, `./core`, `./button`, `./input-text`, `./select`),
 *      each with a runtime ("default") entry AND a "types" entry, and every
 *      referenced file resolves on disk.
 *   3. Its dist package.json declares zero `@halolib-ui/*` entries in
 *      `dependencies` or `peerDependencies` (no runtime cross-package
 *      dependency survives consolidation).
 *   4. Invariant: .github/workflows/release.yml must still publish from
 *      dist/libs/halo-ui. If the publish step ever points back at the source
 *      (libs/halo-ui) or reverts to `changeset publish`, this fails explicitly
 *      instead of passing silently on a dist/ directory nobody publishes.
 *      The run-level release tag is validated separately in the
 *      "Create release tag" step (post-#156 the per-package tag moved out of
 *      the publish step so it is no longer duplicated).
 *
 * Usage: node tools/release/validate-packages.mjs  (run after `nx build`)
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(scriptDir, '../..');
const workflowPath = join(repoRoot, '.github/workflows/release.yml');

/** Subpaths every consumer must be able to resolve (spec: library-packaging). */
const REQUIRED_ENTRY_POINTS = ['.', './core', './button', './input-text', './select'];

const failures = [];
const log = (msg) => console.log(msg);

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

/** Every package under libs/* that is meant to reach npm. */
function publishableLibs() {
  const libsDir = join(repoRoot, 'libs');
  return readdirSync(libsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const pkgPath = join(libsDir, entry.name, 'package.json');
      if (!existsSync(pkgPath)) return null;
      try {
        return { lib: entry.name, pkg: readJson(pkgPath) };
      } catch {
        return null;
      }
    })
    .filter((candidate) => candidate !== null && candidate.pkg.publishConfig?.access === 'public');
}

/**
 * Pure check — does `exportsMap` expose every key in `requiredKeys`, each
 * with both a runtime ("default") entry and a "types" entry? No filesystem
 * access here; whether the referenced files actually exist on disk is a
 * separate, impure concern (see `checkEntryPointFiles`).
 */
export function checkExportsShape(exportsMap, requiredKeys) {
  const missing = [];
  const missingRuntime = [];
  const missingTypes = [];
  for (const key of requiredKeys) {
    const entry = exportsMap?.[key];
    if (!entry) {
      missing.push(key);
      continue;
    }
    const runtime = typeof entry === 'string' ? entry : entry.default;
    const types = typeof entry === 'object' && entry !== null ? entry.types : undefined;
    if (!runtime) missingRuntime.push(key);
    if (!types) missingTypes.push(key);
  }
  return {
    ok: missing.length === 0 && missingRuntime.length === 0 && missingTypes.length === 0,
    missing,
    missingRuntime,
    missingTypes,
  };
}

/**
 * Pure check — no `dependencies`/`peerDependencies` key may start with
 * `@halolib-ui/` (spec: "No Runtime Cross-Package Dependencies"). A stale
 * entry here would mean the consolidated build still depends on one of the
 * 4 deleted sibling packages at runtime.
 */
export function checkNoCrossPackageDeps(pkg) {
  const offenders = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ].filter((name) => name.startsWith('@halolib-ui/'));
  return { ok: offenders.length === 0, offenders };
}

/** Impure: resolve each entry point's runtime/types file against disk. */
function checkEntryPointFiles(exportsMap, lib) {
  for (const key of REQUIRED_ENTRY_POINTS) {
    const entry = exportsMap[key];
    if (!entry) continue; // already reported by checkExportsShape
    const runtime = typeof entry === 'string' ? entry : entry.default;
    const types = typeof entry === 'object' && entry !== null ? entry.types : undefined;
    if (runtime && !existsSync(join(repoRoot, 'dist', 'libs', lib, runtime))) {
      failures.push(
        `exports["${key}"].default points at a file that does not exist on disk: ${runtime}`,
      );
    }
    if (types && !existsSync(join(repoRoot, 'dist', 'libs', lib, types))) {
      failures.push(
        `exports["${key}"].types points at a file that does not exist on disk: ${types}`,
      );
    }
  }
}

/** Check the dist package.json that actually gets published. */
function checkDistPackage({ lib, pkg }) {
  const distPkgPath = join(repoRoot, 'dist', 'libs', lib, 'package.json');
  if (!existsSync(distPkgPath)) {
    failures.push(
      `${pkg.name}: missing dist/libs/${lib}/package.json — publishable package ` +
        'has no dist build, so the publish step would fail against an empty directory',
    );
    return;
  }
  const dist = readJson(distPkgPath);
  const exportsMap = dist.exports || {};

  const shape = checkExportsShape(exportsMap, REQUIRED_ENTRY_POINTS);
  for (const key of shape.missing) {
    failures.push(
      `${pkg.name}: dist package.json exports is missing "${key}" (the #85 regression)`,
    );
  }
  for (const key of shape.missingRuntime) {
    failures.push(`${pkg.name}: exports["${key}"] has no runtime ("default") entry`);
  }
  for (const key of shape.missingTypes) {
    failures.push(
      `${pkg.name}: exports["${key}"] has no "types" entry — consumers get no declaration file`,
    );
  }
  if (shape.ok) checkEntryPointFiles(exportsMap, lib);

  const crossDeps = checkNoCrossPackageDeps(dist);
  if (!crossDeps.ok) {
    failures.push(
      `${pkg.name}: dist package.json declares stale @halolib-ui/* dependency/peerDependency — ` +
        crossDeps.offenders.join(', '),
    );
  }

  if (shape.ok && crossDeps.ok) {
    log(
      `  ok  ${pkg.name} (dist/libs/${lib}) — all ${REQUIRED_ENTRY_POINTS.length} entry points resolve, no @halolib-ui/* deps`,
    );
  }
}

/** Extract one step block (by name) from the workflow YAML text. */
export function extractStep(workflow, name) {
  const lines = workflow.split('\n');
  const start = lines.findIndex((line) => line.trim().startsWith(`- name: ${name}`));
  if (start === -1) return '';
  const block = [lines[start]];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^\s*-\s+(name|uses|run|if):/.test(lines[i])) break;
    block.push(lines[i]);
  }
  return block.join('\n');
}

/**
 * Threat Matrix — Git repository selection / Push state (#139 S3, issue
 * threat: "five brand-new tag refs pushed with an explicit refspec").
 *
 * Pure check (no shared-state side effects) so it is independently testable:
 * the "Create release tag" step must still create an annotated tag for the
 * run-level release (`release-v${version}`) and push it with
 * `git push origin`, in the implicit checkout cwd — no `git -C`/relative-path
 * repo selection, and no `--force`/`+refs` force-push escape hatch.
 *
 * Post-#156 the per-package `<name>@<version>` tag was removed from the
 * publish step because it duplicated the run-level tag on the same commit.
 * This check now targets the dedicated "Create release tag" step instead.
 */
export function checkReleaseTagInvariant(step) {
  // Escape hatches checked first: an inserted -C/relative-path or
  // --force/+refs would also corrupt the exact-shape checks below, so
  // detecting them first gives a precise, non-misleading failure reason.
  if (/git\s+-C\s+\S+/.test(step) || /git\s+tag\s+-a\s+["']?\.\.\//.test(step)) {
    return {
      ok: false,
      reason: 'git repo selection escaped the implicit checkout cwd via -C or a relative path',
    };
  }
  if (/--force\b/.test(step) || /\+refs\//.test(step)) {
    return { ok: false, reason: 'tag push gained a --force or +refs escape hatch' };
  }
  if (!/release-v\$\{version\}/.test(step)) {
    return { ok: false, reason: 'missing `release-v${version}` tag definition' };
  }
  if (!/git tag -a\s+/.test(step)) {
    return { ok: false, reason: 'missing annotated `git tag -a`' };
  }
  if (!/git push origin\s+/.test(step)) {
    return { ok: false, reason: 'missing `git push origin` for the release tag' };
  }
  return { ok: true };
}

/**
 * Pure check — replaces the old 5-package publish-order invariant now that
 * there is exactly one publishable lib. The publish step must still target
 * `dist/libs/halo-ui`, never the source (`libs/halo-ui`) or `changeset
 * publish` (the #85 regression class).
 */
export function checkDistPublishTargetInvariant(step) {
  const publishesDist = /npm publish\s+"dist\/libs\/halo-ui"/.test(step);
  const publishesSource =
    /npm publish\s+"libs\/halo-ui"|npm publish\s+"\$lib_dir"|npm publish\s+"\$src_pkg"|npm publish\s+"\$dist_dir"|changeset publish/.test(
      step,
    );
  if (!publishesDist || publishesSource) {
    return {
      ok: false,
      reason:
        'publish step no longer targets dist/libs/halo-ui — validation checks that directory ' +
        'while publish would target something else (the #85 source-vs-dist regression)',
    };
  }
  return { ok: true };
}

/** Check: the validated directory is the directory release.yml publishes. */
function checkPublishInvariant(workflow) {
  const step = extractStep(workflow, 'Publish to npm from dist');
  if (!step) {
    failures.push(
      'release.yml invariant: "Publish to npm from dist" step not found — ' +
        'the publish target can no longer be verified',
    );
    return;
  }

  const targetCheck = checkDistPublishTargetInvariant(step);
  if (!targetCheck.ok) {
    failures.push(`release.yml invariant: ${targetCheck.reason}`);
    return;
  }
  log('  ok  release.yml — publish still targets dist/libs/halo-ui');

  const tagStep = extractStep(workflow, 'Create release tag');
  if (!tagStep) {
    failures.push(
      'release.yml invariant: "Create release tag" step not found — ' +
        'the release tag can no longer be verified',
    );
    return;
  }

  const tagCheck = checkReleaseTagInvariant(tagStep);
  if (!tagCheck.ok) {
    failures.push(`release.yml invariant: release tag step regressed — ${tagCheck.reason}`);
    return;
  }
  log('  ok  release.yml — release tag step still creates and pushes the version tag');
}

// `file://${process.argv[1]}` only matches import.meta.url on POSIX — on
// Windows process.argv[1] uses backslashes (e.g. `C:\repo\file.mjs`) while
// import.meta.url is always a proper `file:///C:/repo/file.mjs` URL, so that
// naive comparison silently never matches and this script's checks never
// ran when invoked directly on Windows. pathToFileURL().href normalizes
// both sides to the same URL form on every platform.
const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  console.log('Validating publishable packages before publish...');
  const libs = publishableLibs();
  if (libs.length !== 1) {
    failures.push(
      `expected exactly one publishable lib under libs/* (publishConfig.access === "public"), ` +
        `found ${libs.length}${libs.length > 0 ? ': ' + libs.map((entry) => entry.lib).join(', ') : ''}`,
    );
  }
  for (const entry of libs) checkDistPackage(entry);

  let workflow = '';
  try {
    workflow = readFileSync(workflowPath, 'utf8');
  } catch {
    failures.push(`${workflowPath} unreadable — release.yml invariant not verified`);
  }
  if (workflow) checkPublishInvariant(workflow);

  if (failures.length > 0) {
    console.error('\nValidation FAILED:');
    for (const failure of failures) console.error(`  - ${failure}`);
    console.error('\nFix the issues above; the publish step will not run until validation passes.');
    process.exit(1);
  }
  console.log('\nAll publishable packages validated. Ready to publish.');
}
