import { Component, ViewEncapsulation } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

// jest-axe v10 has no TS declarations — use require()
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { axe, toHaveNoViolations } = require('jest-axe') as {
  axe: (
    element: Element | Document,
    options?: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  toHaveNoViolations: Record<string, jest.CustomMatcher>;
};

import { HaIcon } from './icon.component';
import { HA_ICON_REGISTRY, HA_ICON_NAMES } from './icon.registry';
import type { HaIconName } from './icon.registry';
import type { HaIconSize } from './icon.types';

expect.extend(toHaveNoViolations);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

@Component({
  selector: 'ha-icon-test-host',
  standalone: true,
  imports: [HaIcon],
  encapsulation: ViewEncapsulation.None,
  template: `<ha-icon
    [name]="name"
    [size]="size"
    [ariaLabel]="ariaLabel"
    [strokeWidth]="strokeWidth"
    [nonScalingStroke]="nonScalingStroke"
    [title]="title"
  ></ha-icon>`,
})
class TestHost {
  name: HaIconName = 'check';
  size: HaIconSize = 'md';
  ariaLabel = '';
  strokeWidth = 2;
  nonScalingStroke = false;
  title = '';
}

describe('HA_ICON_NAMES', () => {
  it('is non-empty and matches the registry key count', () => {
    expect(HA_ICON_NAMES.length).toBeGreaterThan(0);
    expect(HA_ICON_NAMES.length).toBe(Object.keys(HA_ICON_REGISTRY).length);
  });

  it('is sorted alphabetically', () => {
    expect([...HA_ICON_NAMES]).toEqual([...HA_ICON_NAMES].sort());
  });
});

describe('HaIcon', () => {
  const activeFixtures: ComponentFixture<unknown>[] = [];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
  });

  afterEach(() => {
    activeFixtures.forEach((fixture) => fixture.destroy());
    activeFixtures.length = 0;
  });

  function createTestHost(): {
    fixture: ComponentFixture<TestHost>;
    host: TestHost;
    hostEl: HTMLElement;
  } {
    const fixture = TestBed.createComponent(TestHost);
    activeFixtures.push(fixture);
    const hostEl = fixture.nativeElement.querySelector('ha-icon') as HTMLElement;
    return { fixture, host: fixture.componentInstance, hostEl };
  }

  it('renders the icon corresponding to a given name', () => {
    const { fixture, host, hostEl } = createTestHost();
    host.name = 'check';
    fixture.detectChanges();

    const svg = hostEl.querySelector('svg');
    const checkIcon = HA_ICON_REGISTRY['check'] as unknown as {
      icon: { node: [string, Record<string, string>][] };
    };
    const expectedPath = checkIcon.icon.node[0][1]['d'];

    expect(svg).toBeTruthy();
    expect(svg?.querySelector('path')?.getAttribute('d')).toBe(expectedPath);
  });

  it('changes the rendered icon when name changes', () => {
    const { fixture, host, hostEl } = createTestHost();
    host.name = 'check';
    fixture.detectChanges();
    const checkPath = hostEl.querySelector('svg path')?.getAttribute('d');

    host.name = 'x';
    fixture.detectChanges();
    const xPath = hostEl.querySelector('svg path')?.getAttribute('d');

    expect(xPath).not.toBe(checkPath);
  });

  it('defaults to size md, rendering at 24px', () => {
    const { fixture, hostEl } = createTestHost();
    fixture.detectChanges();

    const svg = hostEl.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('height')).toBe('24');
  });

  it('renders at 20px for size sm', () => {
    const { fixture, host, hostEl } = createTestHost();
    host.size = 'sm';
    fixture.detectChanges();

    const svg = hostEl.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('20');
    expect(svg?.getAttribute('height')).toBe('20');
  });

  it('renders at 32px for size lg', () => {
    const { fixture, host, hostEl } = createTestHost();
    host.size = 'lg';
    fixture.detectChanges();

    const svg = hostEl.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });

  it('sets BEM host classes ha-icon ha-icon--{size}', () => {
    const { fixture, host, hostEl } = createTestHost();
    host.size = 'lg';
    fixture.detectChanges();

    expect(hostEl.className).toBe('ha-icon ha-icon--lg');
  });

  describe('strokeWidth / nonScalingStroke / title', () => {
    it('defaults to strokeWidth 2', () => {
      const { fixture, hostEl } = createTestHost();
      fixture.detectChanges();

      const svg = hostEl.querySelector('svg');
      expect(svg?.getAttribute('stroke-width')).toBe('2');
    });

    it('forwards a custom strokeWidth to the rendered svg', () => {
      const { fixture, host, hostEl } = createTestHost();
      host.strokeWidth = 1;
      fixture.detectChanges();

      const svg = hostEl.querySelector('svg');
      expect(svg?.getAttribute('stroke-width')).toBe('1');
    });

    it('renders no <title> element when title is empty (default)', () => {
      const { fixture, hostEl } = createTestHost();
      fixture.detectChanges();

      expect(hostEl.querySelector('svg > title')).toBeNull();
    });

    it('renders a <title> element with the given text when title is set', () => {
      const { fixture, host, hostEl } = createTestHost();
      host.title = 'Success';
      fixture.detectChanges();

      expect(hostEl.querySelector('svg > title')?.textContent).toBe('Success');
    });

    it('accepts nonScalingStroke without throwing and keeps rendering the icon', () => {
      const { fixture, host, hostEl } = createTestHost();
      host.nonScalingStroke = true;
      fixture.detectChanges();

      expect(hostEl.querySelector('svg path')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('is decorative by default: no role, aria-hidden="true"', () => {
      const { fixture, hostEl } = createTestHost();
      fixture.detectChanges();

      expect(hostEl.getAttribute('role')).toBeNull();
      expect(hostEl.getAttribute('aria-hidden')).toBe('true');
    });

    it('passes jest-axe with no violations when decorative', async () => {
      const { fixture, hostEl } = createTestHost();
      fixture.detectChanges();

      const results = await axe(hostEl);
      expect(results).toHaveNoViolations();
    });

    it('exposes role="img" and aria-label when ariaLabel is set', () => {
      const { fixture, host, hostEl } = createTestHost();
      host.ariaLabel = 'Success';
      fixture.detectChanges();

      expect(hostEl.getAttribute('role')).toBe('img');
      expect(hostEl.getAttribute('aria-label')).toBe('Success');
      expect(hostEl.hasAttribute('aria-hidden')).toBe(false);
    });

    it('passes jest-axe with no violations when labeled', async () => {
      const { fixture, host, hostEl } = createTestHost();
      host.ariaLabel = 'Success';
      fixture.detectChanges();

      const results = await axe(hostEl);
      expect(results).toHaveNoViolations();
    });
  });
});
