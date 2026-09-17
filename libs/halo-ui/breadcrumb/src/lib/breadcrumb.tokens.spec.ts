import { HA_COMPONENT_TOKEN_DEFAULTS } from '@halolib-ui/angular/core';
import { HA_BREADCRUMB_TOKENS } from './breadcrumb.tokens';

const FLAT_BREADCRUMB_TOKENS: Record<string, string> = Object.fromEntries(
  Object.values(HA_BREADCRUMB_TOKENS).flatMap((group) => Object.entries(group)),
);

describe('Breadcrumb Tokens', () => {
  it('should export HA_BREADCRUMB_TOKENS with CSS variable name strings', () => {
    expect(HA_BREADCRUMB_TOKENS).toBeDefined();
    expect(HA_BREADCRUMB_TOKENS.typography.fontFamily).toBe('--ha-breadcrumb-font-family');
    expect(HA_BREADCRUMB_TOKENS.color.linkColor).toBe('--ha-breadcrumb-link-color');
  });

  it('should include all required token keys', () => {
    const keys = Object.keys(FLAT_BREADCRUMB_TOKENS);
    const required = [
      'fontFamily',
      'fontWeight',
      'lineHeight',
      'fontSm',
      'fontMd',
      'fontLg',
      'gapSm',
      'gapMd',
      'gapLg',
      'linkColor',
      'linkHoverColor',
      'currentColor',
      'separatorColor',
      'focusRing',
      'focusRingOffset',
      'overlayBg',
      'overlayBorder',
      'overlayRadius',
      'overlayShadow',
      'overlayPaddingY',
      'overlayOffset',
    ];

    for (const key of required) {
      expect(keys).toContain(key);
    }
    expect(keys).toHaveLength(required.length);
  });

  it('should have all values prefixed with --ha-breadcrumb-', () => {
    const values = Object.values(FLAT_BREADCRUMB_TOKENS);
    for (const value of values) {
      expect(value).toMatch(/^--ha-breadcrumb-/);
    }
  });

  it('every HA_BREADCRUMB_TOKENS value MUST be a key of HA_COMPONENT_TOKEN_DEFAULTS (foundation provides a default for every breadcrumb token)', () => {
    const defaultsKeys = Object.keys(HA_COMPONENT_TOKEN_DEFAULTS);
    for (const cssVarName of Object.values(FLAT_BREADCRUMB_TOKENS)) {
      expect(defaultsKeys).toContain(cssVarName);
    }
  });
});
