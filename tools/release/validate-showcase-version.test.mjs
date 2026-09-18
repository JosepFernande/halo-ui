// Node built-in test runner: `node --test tools/release/validate-showcase-version.test.mjs`
//
// Covers the pure comparison logic of the showcase-version validation script
// without touching the real project files or requiring `npm ci`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateAlignment } from './validate-showcase-version.mjs';

const scriptPath = fileURLToPath(new URL('./validate-showcase-version.mjs', import.meta.url));

const packageVersion = (version) =>
  JSON.stringify({ name: '@halolib-ui/angular', version });

const componentVersion = (version) => `
export class HomePageComponent {
  /** Published version of \`@halolib-ui/angular\`. */
  protected static readonly LIBRARY_VERSION = '${version}';
}
`;

test('validateAlignment passes when versions match', () => {
  const result = validateAlignment({
    libPackageContent: packageVersion('19.2.0'),
    showcaseComponentContent: componentVersion('19.2.0'),
  });
  assert.equal(result.ok, true);
  assert.equal(result.libVersion, '19.2.0');
  assert.equal(result.showcaseVersion, '19.2.0');
});

test('validateAlignment fails when versions differ', () => {
  const result = validateAlignment({
    libPackageContent: packageVersion('19.2.0'),
    showcaseComponentContent: componentVersion('19.0.0'),
  });
  assert.equal(result.ok, false);
  assert.equal(result.libVersion, '19.2.0');
  assert.equal(result.showcaseVersion, '19.0.0');
});

test('validateAlignment throws when the package version is missing', () => {
  assert.throws(
    () =>
      validateAlignment({
        libPackageContent: '{"name":"@halolib-ui/angular"}',
        showcaseComponentContent: componentVersion('19.0.0'),
      }),
    /missing a valid version/,
  );
});

test('validateAlignment throws when the showcase constant is missing', () => {
  assert.throws(
    () =>
      validateAlignment({
        libPackageContent: packageVersion('19.2.0'),
        showcaseComponentContent: 'export class HomePageComponent {}',
      }),
    /not found/,
  );
});

// Regression guard: the CLI entry point must actually run its checks and
// produce output instead of silently exiting 0.
test('running the script directly exits 0 when the project files are aligned', () => {
  const result = spawnSync(process.execPath, [scriptPath], { encoding: 'utf8' });
  assert.equal(result.status, 0, `script failed: ${result.stderr}`);
  assert.match(result.stdout, /matches libs\/halo-ui\/package\.json/);
});
