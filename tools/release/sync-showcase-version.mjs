#!/usr/bin/env node
/**
 * Sync the showcase's displayed `@halolib-ui/angular` version with the
 * publishable library version in `libs/halo-ui/package.json`.
 *
 * The release workflow bumps `libs/halo-ui/package.json` via
 * `npx changeset version`; running this step before the version-packages PR is
 * created keeps the landing page constant from drifting out of alignment.
 *
 * Usage: node tools/release/sync-showcase-version.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(scriptDir, '../..');
const libPackagePath = join(repoRoot, 'libs/halo-ui/package.json');
const showcaseComponentPath = join(
  repoRoot,
  'apps/showcase/src/app/pages/home-page/home-page.component.ts',
);

const SHOWCASE_VERSION_RE =
  /(protected\s+static\s+readonly\s+LIBRARY_VERSION\s*=\s*)'[^']*';/;

/** Pure: read the `version` field from a library package.json string. */
export function readLibraryVersion(packageJsonContent) {
  const pkg = JSON.parse(packageJsonContent);
  if (typeof pkg.version !== 'string' || pkg.version === '') {
    throw new Error('libs/halo-ui/package.json is missing a valid version');
  }
  return pkg.version;
}

/** Pure: extract the current `LIBRARY_VERSION` value from the component source. */
export function readShowcaseVersion(componentSource) {
  const match = componentSource.match(SHOWCASE_VERSION_RE);
  if (!match) {
    throw new Error(
      'LIBRARY_VERSION constant not found in showcase home-page component',
    );
  }
  const valueMatch = match[0].match(/'([^']*)'/);
  return valueMatch ? valueMatch[1] : '';
}

/** Pure: return component source with `LIBRARY_VERSION` set to `version`. */
export function buildSyncedComponent(componentSource, version) {
  return componentSource.replace(
    SHOWCASE_VERSION_RE,
    `$1'${version}';`,
  );
}

// `file://${process.argv[1]}` only matches import.meta.url on POSIX — on
// Windows process.argv[1] uses backslashes while import.meta.url is always a
// normalized file:/// URL, so that naive comparison silently never matches.
// pathToFileURL().href normalizes both sides on every platform.
const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  try {
    const packageJsonContent = readFileSync(libPackagePath, 'utf8');
    const componentContent = readFileSync(showcaseComponentPath, 'utf8');

    const libVersion = readLibraryVersion(packageJsonContent);
    const showcaseVersion = readShowcaseVersion(componentContent);
    const updatedContent = buildSyncedComponent(componentContent, libVersion);

    if (updatedContent === componentContent) {
      console.log(
        `Showcase library version is already aligned with libs/halo-ui (${libVersion}).`,
      );
      process.exit(0);
    }

    writeFileSync(showcaseComponentPath, updatedContent, 'utf8');
    console.log(
      `Synced showcase LIBRARY_VERSION from ${showcaseVersion} to ${libVersion} (libs/halo-ui).`,
    );
    process.exit(0);
  } catch (err) {
    console.error(`Failed to sync showcase version: ${err.message}`);
    process.exit(1);
  }
}
