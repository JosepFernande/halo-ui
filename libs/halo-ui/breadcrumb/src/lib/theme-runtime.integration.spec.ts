import * as fs from 'node:fs';
import * as path from 'node:path';
import { Component, ViewEncapsulation } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DEFAULT_THEME, provideHaTheme } from '@halolib-ui/angular/core';
import { HaBreadcrumb } from './breadcrumb.component';

/** Reads the actual `breadcrumb.component.css` source (not a mock). */
function readBreadcrumbComponentCss(): string {
  return fs.readFileSync(path.resolve(__dirname, 'breadcrumb.component.css'), 'utf-8');
}

/**
 * End-to-end proof (mirrors `button/theme-runtime.integration.spec.ts`): a
 * custom color registered via `provideHaTheme()` resolves through the
 * default `--ha-breadcrumb-link-color`/`--ha-breadcrumb-link-hover-color`
 * tokens once the eager DOM write (theme-provider.ts) fires.
 *
 * jsdom does not perform CSS `var()` resolution/cascade, so this test proves
 * the DOM-variable contract structurally: the correct value is written to
 * the correct custom property, and `breadcrumb.component.css` references
 * that exact property (via a static read of the stylesheet source, since
 * `getComputedStyle` cannot observe Angular component styles under
 * `TestBed`/jsdom — see `button`'s equivalent spec for the full rationale).
 */
@Component({
  selector: 'ha-theme-runtime-test-host',
  standalone: true,
  imports: [HaBreadcrumb],
  encapsulation: ViewEncapsulation.None,
  template: `<ha-breadcrumb [items]="[{ label: 'Inicio', link: '/' }, { label: 'Actual' }]" />`,
})
class ThemeRuntimeTestHost {}

describe('Theme runtime integration — Breadcrumb resolves the default theme with zero Breadcrumb changes', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeRuntimeTestHost],
      providers: [provideHaTheme(), provideRouter([])],
    }).compileComponents();
  });

  it('--ha-primary (default theme, no config) resolves directly to its real value, and the Foundation default for --ha-breadcrumb-link-color references it', () => {
    const fixture: ComponentFixture<ThemeRuntimeTestHost> =
      TestBed.createComponent(ThemeRuntimeTestHost);
    fixture.detectChanges();

    expect(document.documentElement.style.getPropertyValue('--ha-primary')).toBe(
      DEFAULT_THEME.colors['primary'] as string,
    );

    expect(document.documentElement.style.getPropertyValue('--ha-breadcrumb-link-color')).toBe(
      'var(--ha-primary)',
    );
    expect(
      document.documentElement.style.getPropertyValue('--ha-breadcrumb-link-hover-color'),
    ).toBe('var(--ha-primary-hover)');
  });

  it('the Theme Engine writes the md Breadcrumb typography/sizing tokens matching HA_BREADCRUMB_TOKEN_DEFAULT_VALUES', () => {
    TestBed.createComponent(ThemeRuntimeTestHost).detectChanges();
    const rootStyle = document.documentElement.style;

    expect(rootStyle.getPropertyValue('--ha-breadcrumb-font-family')).toBe('var(--font-family)');
    expect(rootStyle.getPropertyValue('--ha-breadcrumb-font-md')).toBe(
      'var(--font-size-small-body)',
    );
  });

  it('the Theme Engine writes the collapsed-items overlay surface tokens matching HA_BREADCRUMB_TOKEN_DEFAULT_VALUES', () => {
    TestBed.createComponent(ThemeRuntimeTestHost).detectChanges();
    const rootStyle = document.documentElement.style;

    expect(rootStyle.getPropertyValue('--ha-breadcrumb-overlay-bg')).toBe('var(--neutral-50)');
    expect(rootStyle.getPropertyValue('--ha-breadcrumb-overlay-radius')).toBe('var(--radius-sm)');
  });

  it('breadcrumb.component.css wires the link/current/separator tokens to their matching custom property', () => {
    const css = readBreadcrumbComponentCss();

    expect(css).toMatch(
      /\.ha-breadcrumb__link\s*\{[^}]*color:\s*var\(--ha-breadcrumb-link-color\)/,
    );
    expect(css).toMatch(
      /\.ha-breadcrumb__link:hover\s*\{[^}]*color:\s*var\(--ha-breadcrumb-link-hover-color\)/,
    );
    expect(css).toMatch(
      /\.ha-breadcrumb__current\s*\{[^}]*color:\s*var\(--ha-breadcrumb-current-color\)/,
    );
    expect(css).toMatch(
      /\.ha-breadcrumb__separator\s*\{[^}]*color:\s*var\(--ha-breadcrumb-separator-color\)/,
    );
  });

  it('breadcrumb.component.css wires the collapsed-items overlay surface to its matching custom properties', () => {
    const css = readBreadcrumbComponentCss();

    expect(css).toMatch(
      /\.ha-breadcrumb__overlay-list\s*\{[^}]*background:\s*var\(--ha-breadcrumb-overlay-bg\)/,
    );
    expect(css).toMatch(
      /\.ha-breadcrumb__overlay-list\s*\{[^}]*border-radius:\s*var\(--ha-breadcrumb-overlay-radius\)/,
    );
  });
});
