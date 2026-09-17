import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';

const ENTRY_POINTS = ['core', 'button', 'input-text', 'select', 'breadcrumb'] as const;

function libRoot(): string {
  return path.resolve(__dirname, '../..');
}

function workspaceRoot(): string {
  return path.resolve(libRoot(), '..', '..');
}

function distDir(): string {
  return path.resolve(workspaceRoot(), 'dist', 'libs', 'halo-ui');
}

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Target contract for the consolidated `@halolib-ui/angular` package
 * (single ng-packagr build, secondary entry points for core/button/input-text/select).
 * See sdd/consolidate-halo-ui-single-package spec + design.
 *
 * This spec intentionally spans the full migration:
 * - Source-level assertions become true as soon as PR1's inert scaffold lands.
 * - Some source-level assertions (single publishable lib, no @halolib-ui/* deps,
 *   barrel re-export of subpaths) only become true once Phase 2a/2b move real
 *   source and delete the legacy `libs/{core,button,input-text,select}` projects.
 * - Dist-level assertions only become true once Phase 2b switches the `build`
 *   target to `@nx/angular:package` (ng-packagr).
 */
describe('Packaging contract — source-level', () => {
  describe('exactly one publishable libs/* project', () => {
    it('only @halolib-ui/angular declares publishConfig.access "public"', () => {
      const workspaceLibsDir = path.resolve(workspaceRoot(), 'libs');
      const libDirs = fs
        .readdirSync(workspaceLibsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

      const publishable = libDirs.filter((name) => {
        const pkgPath = path.resolve(workspaceLibsDir, name, 'package.json');
        if (!fs.existsSync(pkgPath)) return false;
        const pkg = readJson(pkgPath);
        const publishConfig = pkg['publishConfig'] as Record<string, unknown> | undefined;
        return publishConfig?.['access'] === 'public' && pkg['private'] !== true;
      });

      expect(publishable.sort()).toEqual(['halo-ui']);
    });
  });

  describe('libs/halo-ui/package.json', () => {
    const pkg = readJson(path.resolve(libRoot(), 'package.json'));

    it('name is @halolib-ui/angular', () => {
      expect(pkg['name']).toBe('@halolib-ui/angular');
    });

    it('sideEffects is set to false', () => {
      expect(pkg['sideEffects']).toBe(false);
    });

    it('declares no @halolib-ui/* runtime dependencies', () => {
      const deps = pkg['dependencies'] as Record<string, string> | undefined;
      const keys = Object.keys(deps ?? {});
      expect(keys.some((key) => key.startsWith('@halolib-ui/'))).toBe(false);
    });

    it('declares no @halolib-ui/* peerDependencies', () => {
      const peers = pkg['peerDependencies'] as Record<string, string> | undefined;
      const keys = Object.keys(peers ?? {});
      expect(keys.some((key) => key.startsWith('@halolib-ui/'))).toBe(false);
    });

    it('peerDependencies include all 4 Angular packages', () => {
      const peers = pkg['peerDependencies'] as Record<string, string> | undefined;
      expect(peers).toBeDefined();
      expect(peers!['@angular/common']).toBeDefined();
      expect(peers!['@angular/core']).toBeDefined();
      expect(peers!['@angular/cdk']).toBeDefined();
      expect(peers!['@angular/forms']).toBeDefined();
    });

    it('exports map has root, package.json, and all 5 entry-point subpaths', () => {
      const exportsMap = pkg['exports'] as Record<string, unknown> | undefined;
      expect(exportsMap).toBeDefined();
      expect(exportsMap!['.']).toBeDefined();
      expect(exportsMap!['./package.json']).toBeDefined();
      for (const entry of ENTRY_POINTS) {
        expect(exportsMap![`./${entry}`]).toBeDefined();
      }
    });
  });

  describe('src/index.ts primary barrel', () => {
    it('re-exports all 5 entry-point subpaths via the published package specifier', () => {
      const indexPath = path.resolve(libRoot(), 'src', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      for (const entry of ENTRY_POINTS) {
        expect(content).toContain(`export * from '@halolib-ui/angular/${entry}'`);
      }
    });

    it('contains no other exports (barrel-only, no local source)', () => {
      const indexPath = path.resolve(libRoot(), 'src', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      const exportLines = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      expect(exportLines.length).toBe(ENTRY_POINTS.length);
    });
  });

  describe.each(ENTRY_POINTS)('%s secondary entry point', (entry) => {
    it('has an ng-package.json declaring lib.entryFile', () => {
      const ngPackagePath = path.resolve(libRoot(), entry, 'ng-package.json');
      expect(fs.existsSync(ngPackagePath)).toBe(true);
      const ngPackage = readJson(ngPackagePath);
      const lib = ngPackage['lib'] as Record<string, unknown> | undefined;
      expect(lib?.['entryFile']).toBeDefined();
    });

    it('has a src/index.ts', () => {
      const indexPath = path.resolve(libRoot(), entry, 'src', 'index.ts');
      expect(fs.existsSync(indexPath)).toBe(true);
    });
  });

  describe('core secondary entry point — real theme API source (Phase 2a)', () => {
    it('src/index.ts is the real theme-engine barrel, not the generator stub', () => {
      const indexPath = path.resolve(libRoot(), 'core', 'src', 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).not.toContain('greeting');
      expect(content).not.toContain('Hello World');
      expect(content).toContain('provideHaTheme');
      expect(content).toContain('HaThemeService');
      expect(content).toContain('DEFAULT_THEME');
    });

    it('src/lib contains the migrated theme engine source (theme-engine.ts, theme-provider.ts)', () => {
      const themeEngine = path.resolve(libRoot(), 'core', 'src', 'lib', 'theme', 'theme-engine.ts');
      const themeProvider = path.resolve(
        libRoot(),
        'core',
        'src',
        'lib',
        'theme',
        'theme-provider.ts',
      );
      expect(fs.existsSync(themeEngine)).toBe(true);
      expect(fs.existsSync(themeProvider)).toBe(true);
    });
  });

  describe('tsconfig.base.json path mappings', () => {
    const tsconfig = readJson(path.resolve(workspaceRoot(), 'tsconfig.base.json'));
    const paths = (tsconfig['compilerOptions'] as Record<string, unknown>)['paths'] as Record<
      string,
      string[]
    >;

    it('maps @halolib-ui/angular to libs/halo-ui/src/index.ts', () => {
      const mapped = paths['@halolib-ui/angular'];
      expect(mapped).toBeDefined();
      expect(mapped!.map((p) => path.resolve(workspaceRoot(), p))).toEqual([
        path.resolve(workspaceRoot(), 'libs/halo-ui/src/index.ts'),
      ]);
    });

    it.each(ENTRY_POINTS)('maps @halolib-ui/angular/%s to its entry-point source', (entry) => {
      expect(paths[`@halolib-ui/angular/${entry}`]).toBeDefined();
    });

    it('declares exactly 7 @halolib-ui/angular* path entries (no legacy 5-package paths)', () => {
      const halolibKeys = Object.keys(paths).filter((key) => key.startsWith('@halolib-ui/angular'));
      expect(halolibKeys.sort()).toEqual(
        [
          '@halolib-ui/angular',
          '@halolib-ui/angular/breadcrumb',
          '@halolib-ui/angular/button',
          '@halolib-ui/angular/core',
          '@halolib-ui/angular/icon',
          '@halolib-ui/angular/input-text',
          '@halolib-ui/angular/select',
        ].sort(),
      );
    });
  });
});

describe('Packaging contract — dist-level', () => {
  beforeAll(() => {
    const dist = distDir();
    if (fs.existsSync(dist)) {
      fs.rmSync(dist, { recursive: true, force: true });
    }
    execSync('nx build halo-ui --configuration=production', {
      stdio: 'inherit',
      cwd: workspaceRoot(),
    });
  }, 180_000);

  describe('dist package.json', () => {
    it('exports map has root, package.json, and all 5 subpaths', () => {
      const pkg = readJson(path.resolve(distDir(), 'package.json'));
      const exportsMap = pkg['exports'] as Record<string, unknown> | undefined;
      expect(exportsMap).toBeDefined();
      expect(exportsMap!['.']).toBeDefined();
      expect(exportsMap!['./package.json']).toBeDefined();
      for (const entry of ENTRY_POINTS) {
        expect(exportsMap![`./${entry}`]).toBeDefined();
      }
    });

    it('has no @halolib-ui/* dependencies', () => {
      const pkg = readJson(path.resolve(distDir(), 'package.json'));
      const deps = pkg['dependencies'] as Record<string, string> | undefined;
      const keys = Object.keys(deps ?? {});
      expect(keys.some((key) => key.startsWith('@halolib-ui/'))).toBe(false);
    });
  });

  describe.each(ENTRY_POINTS)('%s entry-point dist artifacts', (entry) => {
    const bundlePath = () => path.resolve(distDir(), 'fesm2022', `halolib-ui-angular-${entry}.mjs`);
    const dtsPath = () => path.resolve(distDir(), entry, 'index.d.ts');

    it('has a fesm2022 bundle', () => {
      expect(fs.existsSync(bundlePath())).toBe(true);
    });

    it('fesm2022 bundle is non-empty', () => {
      expect(fs.statSync(bundlePath()).size).toBeGreaterThan(0);
    });

    it('has a .d.ts declaration file', () => {
      expect(fs.existsSync(dtsPath())).toBe(true);
    });

    it('.d.ts declaration file is non-empty', () => {
      expect(fs.statSync(dtsPath()).size).toBeGreaterThan(0);
    });
  });

  describe('primary entry re-exports the 5 subpaths', () => {
    const rootBundlePath = () => path.resolve(distDir(), 'fesm2022', 'halolib-ui-angular.mjs');

    it('root fesm2022 bundle exists', () => {
      expect(fs.existsSync(rootBundlePath())).toBe(true);
    });

    it.each(ENTRY_POINTS)('root fesm2022 bundle re-exports the %s entry point', (entry) => {
      // ng-packagr 19's root bundle re-exports secondary entry points via
      // their published package specifier (`export * from
      // '@halolib-ui/angular/<entry>'`), not by inlining/renaming to a
      // synthetic per-entry bundle filename — verified against the real
      // build output (Phase 2b). This mirrors how @angular/cdk and other
      // ng-packagr multi-entry-point packages structure their root barrel.
      const content = fs.readFileSync(rootBundlePath(), 'utf-8');
      expect(content).toContain(`@halolib-ui/angular/${entry}`);
    });
  });

  describe('tree-shaking proxy — core bundle stays framework-lean', () => {
    const coreBundlePath = () => path.resolve(distDir(), 'fesm2022', 'halolib-ui-angular-core.mjs');

    it('core fesm bundle does not import @angular/cdk', () => {
      const content = fs.readFileSync(coreBundlePath(), 'utf-8');
      expect(content).not.toContain("from '@angular/cdk'");
      expect(content).not.toContain('from "@angular/cdk"');
    });

    it('core fesm bundle does not import @angular/forms', () => {
      const content = fs.readFileSync(coreBundlePath(), 'utf-8');
      expect(content).not.toContain("from '@angular/forms'");
      expect(content).not.toContain('from "@angular/forms"');
    });
  });
});
