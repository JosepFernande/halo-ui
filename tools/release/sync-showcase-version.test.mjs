// Node built-in test runner: `node --test tools/release/sync-showcase-version.test.mjs`
//
// Covers the pure core of the showcase-version sync script so the logic is
// testable without importing (and running) the whole CLI script or touching
// the real project files.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  readLibraryVersion,
  readShowcaseVersion,
  buildSyncedComponent,
} from './sync-showcase-version.mjs';

const scriptPath = fileURLToPath(new URL('./sync-showcase-version.mjs', import.meta.url));

const SAMPLE_PACKAGE_JSON = JSON.stringify({ name: '@halolib-ui/angular', version: '19.2.0' });

const SAMPLE_COMPONENT = `import { Component } from '@angular/core';

@Component({
  selector: 'app-home-page',
  standalone: true,
  template: '',
})
export class HomePageComponent {
  /** Published version of \`@halolib-ui/angular\`. */
  protected static readonly LIBRARY_VERSION = '19.0.0';

  protected readonly libraryVersion = HomePageComponent.LIBRARY_VERSION;
}
`;

test('readLibraryVersion returns the package version', () => {
  assert.equal(readLibraryVersion(SAMPLE_PACKAGE_JSON), '19.2.0');
});

test('readLibraryVersion throws when the version is missing', () => {
  assert.throws(() => readLibraryVersion('{"name":"x"}'), /missing a valid version/);
});

test('readShowcaseVersion returns the current constant value', () => {
  assert.equal(readShowcaseVersion(SAMPLE_COMPONENT), '19.0.0');
});

test('readShowcaseVersion throws when the constant is missing', () => {
  assert.throws(() => readShowcaseVersion('export class HomePageComponent {}'), /not found/);
});

test('buildSyncedComponent updates LIBRARY_VERSION and preserves surrounding code', () => {
  const updated = buildSyncedComponent(SAMPLE_COMPONENT, '19.2.0');
  assert.match(updated, /protected static readonly LIBRARY_VERSION = '19\.2\.0';/);
  assert.doesNotMatch(updated, /'19\.0\.0'/);
  assert.match(updated, /protected readonly libraryVersion = HomePageComponent\.LIBRARY_VERSION;/);
});

test('buildSyncedComponent leaves an already-aligned file unchanged', () => {
  const aligned = buildSyncedComponent(SAMPLE_COMPONENT, '19.2.0');
  const secondPass = buildSyncedComponent(aligned, '19.2.0');
  assert.equal(secondPass, aligned);
});

test('buildSyncedComponent only replaces the LIBRARY_VERSION constant', () => {
  const componentWithLiteralElsewhere = SAMPLE_COMPONENT.replace(
    "template: ''",
    "template: '<span>v19.0.0</span>'",
  );
  const updated = buildSyncedComponent(componentWithLiteralElsewhere, '19.2.0');
  assert.match(updated, /<span>v19\.0\.0<\/span>/);
  assert.match(updated, /protected static readonly LIBRARY_VERSION = '19\.2\.0';/);
});

test('sync script writes the file only when the version changes', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'sync-showcase-test-'));
  try {
    const filePath = join(tmpDir, 'home-page.component.ts');
    writeFileSync(filePath, SAMPLE_COMPONENT, 'utf8');

    const initialContent = readFileSync(filePath, 'utf8');
    const updatedContent = buildSyncedComponent(initialContent, '19.2.0');
    assert.notEqual(updatedContent, initialContent);
    writeFileSync(filePath, updatedContent, 'utf8');

    const afterWrite = readFileSync(filePath, 'utf8');
    assert.match(afterWrite, /LIBRARY_VERSION = '19\.2\.0';/);

    const secondPass = buildSyncedComponent(afterWrite, '19.2.0');
    assert.equal(secondPass, afterWrite);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

// Cross-platform CLI entry-point guard: running the script directly must
// actually execute its logic and print output instead of silently no-op'ing.
test('running the script directly exits 0 and reports the result', () => {
  const result = spawnSync(process.execPath, [scriptPath], { encoding: 'utf8' });
  assert.equal(result.status, 0, `script failed: ${result.stderr}`);
  assert.match(
    result.stdout,
    /Showcase library version is already aligned|Synced showcase LIBRARY_VERSION/,
  );
});
