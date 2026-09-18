#!/usr/bin/env node
/**
 * Validate that the showcase's displayed `@halolib-ui/angular` version matches
 * the publishable library version in `libs/halo-ui/package.json`.
 *
 * This script only reads two files, so it does not depend on `npm ci` or on any
 * build artifacts. It is intended to run in CI on every pull request.
 *
 * Usage: node tools/release/validate-showcase-version.mjs
 */
import { readFileSync } from 'node:fs';
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
  /protected\s+static\s+readonly\s+LIBRARY_VERSION\s*=\s*'([^']*)';/;

/** Pure: compare the library version against the showcase constant. */
export function validateAlignment({ libPackageContent, showcaseComponentContent }) {
  const pkg = JSON.parse(libPackageContent);
  if (typeof pkg.version !== 'string' || pkg.version === '') {
    throw new Error('libs/halo-ui/package.json is missing a valid version');
  }

  const match = showcaseComponentContent.match(SHOWCASE_VERSION_RE);
  if (!match) {
    throw new Error(
      'LIBRARY_VERSION constant not found in showcase home-page component',
    );
  }

  const libVersion = pkg.version;
  const showcaseVersion = match[1];

  return {
    ok: libVersion === showcaseVersion,
    libVersion,
    showcaseVersion,
  };
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  try {
    const libPackageContent = readFileSync(libPackagePath, 'utf8');
    const showcaseComponentContent = readFileSync(showcaseComponentPath, 'utf8');
    const result = validateAlignment({ libPackageContent, showcaseComponentContent });

    if (result.ok) {
      console.log(
        `Showcase version (${result.showcaseVersion}) matches libs/halo-ui/package.json (${result.libVersion}).`,
      );
      process.exit(0);
    }

    console.error(
      `Showcase version mismatch: home-page.component.ts shows ${result.showcaseVersion}, ` +
        `but libs/halo-ui/package.json is ${result.libVersion}. ` +
        'Run `npm run sync:showcase-version` to fix it.',
    );
    process.exit(1);
  } catch (err) {
    console.error(`Failed to validate showcase version: ${err.message}`);
    process.exit(1);
  }
}
