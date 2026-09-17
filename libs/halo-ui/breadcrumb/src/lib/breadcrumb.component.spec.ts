import { Component, ViewEncapsulation } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ESCAPE } from '@angular/cdk/keycodes';
// jest-axe v10 has no TS declarations — use require()
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { axe, toHaveNoViolations } = require('jest-axe') as {
  axe: (
    element: Element | Document,
    options?: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
  toHaveNoViolations: Record<string, jest.CustomMatcher>;
};

import { HaBreadcrumb } from './breadcrumb.component';
import { HaBreadcrumbItem, HaBreadcrumbSize } from './breadcrumb.types';

expect.extend(toHaveNoViolations);

// Augment Jest matchers for toHaveNoViolations
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}

/** Dispatches a synthetic `keydown` event with a working `keyCode` (mirrors `select.component.spec.ts`). */
function dispatchKeydown(el: HTMLElement, key: string, keyCode: number): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  el.dispatchEvent(event);
  return event;
}

const SIX_ITEMS: HaBreadcrumbItem[] = [
  { label: 'Inicio', link: '/' },
  { label: 'Nivel 1', link: '/nivel-1' },
  { label: 'Nivel 2', link: '/nivel-2' },
  { label: 'Nivel 3', link: '/nivel-3' },
  { label: 'Nivel 4', link: '/nivel-4' },
  { label: 'Actual' },
];

/**
 * Test host that wraps HaBreadcrumb in a parent template, matching real
 * consumer usage with `<ha-breadcrumb [items]="...">`.
 */
@Component({
  selector: 'ha-test-host',
  standalone: true,
  imports: [HaBreadcrumb],
  encapsulation: ViewEncapsulation.None,
  template: `<ha-breadcrumb
    [items]="items"
    [size]="size"
    [separator]="separator"
    [maxVisible]="maxVisible"
  />`,
})
class TestHost {
  items: HaBreadcrumbItem[] = [
    { label: 'Inicio', link: '/' },
    { label: 'Componentes', link: '/componentes' },
    { label: 'Botón' },
  ];
  size: HaBreadcrumbSize = 'md';
  separator = '/';
  maxVisible: number | undefined = undefined;
}

describe('HaBreadcrumb', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
      // A wildcard route (rather than `[]`) so clicking a real `routerLink`
      // anchor (e.g. the "closes when a linked item inside the overlay is
      // clicked" test below) resolves instead of throwing NG04002
      // asynchronously — an unhandled rejection that otherwise surfaces
      // against a later, unrelated test.
      providers: [provideRouter([{ path: '**', component: TestHost }])],
    }).compileComponents();
  });

  function createTestHost(): {
    fixture: ComponentFixture<TestHost>;
    host: TestHost;
    breadcrumbEl: HTMLElement;
  } {
    const fixture = TestBed.createComponent(TestHost);
    const host = fixture.componentInstance;
    const breadcrumbDebug = fixture.debugElement.query(By.css('ha-breadcrumb'));
    const breadcrumbEl = breadcrumbDebug.nativeElement as HTMLElement;
    return { fixture, host, breadcrumbEl };
  }

  // -----------------------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------------------
  describe('rendering', () => {
    it('should render a nav with aria-label="breadcrumb"', () => {
      const { fixture, breadcrumbEl } = createTestHost();
      fixture.detectChanges();

      const nav = breadcrumbEl.querySelector('nav');
      expect(nav).not.toBeNull();
      expect(nav!.getAttribute('aria-label')).toBe('breadcrumb');
    });

    it('should render one li per item', () => {
      const { fixture, breadcrumbEl } = createTestHost();
      fixture.detectChanges();

      const items = breadcrumbEl.querySelectorAll('.ha-breadcrumb__item');
      expect(items.length).toBe(3);
    });

    it('should always have the base BEM class ha-breadcrumb', () => {
      const { fixture, breadcrumbEl } = createTestHost();
      fixture.detectChanges();

      expect(breadcrumbEl.classList.contains('ha-breadcrumb')).toBe(true);
    });

    it('should render RouterLink anchors for non-last items with a link', () => {
      const { fixture, breadcrumbEl } = createTestHost();
      fixture.detectChanges();

      const links = breadcrumbEl.querySelectorAll('a.ha-breadcrumb__link');
      expect(links.length).toBe(2);
      expect(links[0].textContent).toContain('Inicio');
      expect(links[1].textContent).toContain('Componentes');
    });

    it('should render a non-link span for an item with no link', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = [{ label: 'Sin link' }, { label: 'Actual' }];
      fixture.detectChanges();

      const currentSpans = breadcrumbEl.querySelectorAll('.ha-breadcrumb__current');
      expect(currentSpans.length).toBe(2);
      expect(currentSpans[0].textContent).toContain('Sin link');
    });

    it('should render a separator between items but not after the last one', () => {
      const { fixture, breadcrumbEl } = createTestHost();
      fixture.detectChanges();

      const separators = breadcrumbEl.querySelectorAll('.ha-breadcrumb__separator');
      expect(separators.length).toBe(2);
    });

    it('should render the configured separator content', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.separator = '>';
      fixture.detectChanges();

      const separator = breadcrumbEl.querySelector('.ha-breadcrumb__separator')!;
      expect(separator.textContent).toContain('>');
    });

    it('should mark separators as aria-hidden', () => {
      const { fixture, breadcrumbEl } = createTestHost();
      fixture.detectChanges();

      const separator = breadcrumbEl.querySelector('.ha-breadcrumb__separator')!;
      expect(separator.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // -----------------------------------------------------------------------
  // Last item (current page)
  // -----------------------------------------------------------------------
  describe('last item as current page', () => {
    it('should never render the last item as a link, even if it has one', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = [
        { label: 'Inicio', link: '/' },
        { label: 'Actual', link: '/actual' },
      ];
      fixture.detectChanges();

      const links = breadcrumbEl.querySelectorAll('a.ha-breadcrumb__link');
      expect(links.length).toBe(1);
      expect(links[0].textContent).toContain('Inicio');

      const current = breadcrumbEl.querySelector('.ha-breadcrumb__current')!;
      expect(current.textContent).toContain('Actual');
    });

    it('should set aria-current="page" on the last item only', () => {
      const { fixture, breadcrumbEl } = createTestHost();
      fixture.detectChanges();

      const currentSpan = breadcrumbEl.querySelector('.ha-breadcrumb__current')!;
      expect(currentSpan.getAttribute('aria-current')).toBe('page');

      const links = breadcrumbEl.querySelectorAll('a.ha-breadcrumb__link');
      for (const link of Array.from(links)) {
        expect(link.hasAttribute('aria-current')).toBe(false);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Icons
  // -----------------------------------------------------------------------
  describe('icons', () => {
    it('renders ha-icon before the label when an item has one', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = [{ label: 'Inicio', link: '/', icon: 'house' }, { label: 'Actual' }];
      fixture.detectChanges();

      const link = breadcrumbEl.querySelector('a.ha-breadcrumb__link')!;
      const icon = link.querySelector('ha-icon');
      expect(icon).not.toBeNull();
      expect(link.textContent).toContain('Inicio');
    });

    it('does not render ha-icon when an item has none', () => {
      const { fixture, breadcrumbEl } = createTestHost();
      fixture.detectChanges();

      expect(breadcrumbEl.querySelector('ha-icon')).toBeNull();
    });

    it('renders ha-icon on the current (last) item too', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = [
        { label: 'Inicio', link: '/' },
        { label: 'Actual', icon: 'settings' },
      ];
      fixture.detectChanges();

      const current = breadcrumbEl.querySelector('.ha-breadcrumb__current')!;
      expect(current.querySelector('ha-icon')).not.toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Collapse (maxVisible)
  // -----------------------------------------------------------------------
  describe('collapse (maxVisible)', () => {
    it('does nothing when maxVisible is undefined, regardless of item count', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = SIX_ITEMS;
      host.maxVisible = undefined;
      fixture.detectChanges();

      expect(breadcrumbEl.querySelectorAll('.ha-breadcrumb__item').length).toBe(6);
      expect(breadcrumbEl.querySelector('.ha-breadcrumb__ellipsis')).toBeNull();
    });

    it('does not collapse when item count is within maxVisible', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = SIX_ITEMS;
      host.maxVisible = 6;
      fixture.detectChanges();

      expect(breadcrumbEl.querySelectorAll('.ha-breadcrumb__item').length).toBe(6);
      expect(breadcrumbEl.querySelector('.ha-breadcrumb__ellipsis')).toBeNull();
    });

    it('does not collapse a 2-item trail even with maxVisible=1 (nothing to hide)', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = [{ label: 'Inicio', link: '/' }, { label: 'Actual' }];
      host.maxVisible = 1;
      fixture.detectChanges();

      expect(breadcrumbEl.querySelector('.ha-breadcrumb__ellipsis')).toBeNull();
      expect(breadcrumbEl.querySelectorAll('.ha-breadcrumb__item').length).toBe(2);
    });

    it('collapses to the leading maxVisible items / … / last when item count exceeds maxVisible + 1', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = SIX_ITEMS;
      host.maxVisible = 3;
      fixture.detectChanges();

      // 5 <li>: 3 leading items, ellipsis, last.
      expect(breadcrumbEl.querySelectorAll('.ha-breadcrumb__item').length).toBe(5);
      const ellipsis = breadcrumbEl.querySelector('.ha-breadcrumb__ellipsis');
      expect(ellipsis).not.toBeNull();
      expect(breadcrumbEl.textContent).toContain('Inicio');
      expect(breadcrumbEl.textContent).toContain('Nivel 1');
      expect(breadcrumbEl.textContent).toContain('Nivel 2');
      expect(breadcrumbEl.textContent).toContain('Actual');
      expect(breadcrumbEl.textContent).not.toContain('Nivel 3');
      expect(breadcrumbEl.textContent).not.toContain('Nivel 4');
    });

    it('keeps the leading items as real links when collapsed', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = SIX_ITEMS;
      host.maxVisible = 3;
      fixture.detectChanges();

      const links = breadcrumbEl.querySelectorAll('a.ha-breadcrumb__link');
      expect(links.length).toBe(3);
      expect(links[0].textContent).toContain('Inicio');
      expect(links[1].textContent).toContain('Nivel 1');
      expect(links[2].textContent).toContain('Nivel 2');
    });

    it('does not collapse when maxVisible is 0 (disabled, same as undefined)', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = SIX_ITEMS;
      host.maxVisible = 0;
      fixture.detectChanges();

      expect(breadcrumbEl.querySelectorAll('.ha-breadcrumb__item').length).toBe(6);
      expect(breadcrumbEl.querySelector('.ha-breadcrumb__ellipsis')).toBeNull();
    });

    it('does not collapse when maxVisible is negative', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = SIX_ITEMS;
      host.maxVisible = -1;
      fixture.detectChanges();

      expect(breadcrumbEl.querySelectorAll('.ha-breadcrumb__item').length).toBe(6);
      expect(breadcrumbEl.querySelector('.ha-breadcrumb__ellipsis')).toBeNull();
    });

    it('does not collapse when maxVisible is not an integer', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = SIX_ITEMS;
      host.maxVisible = 2.5;
      fixture.detectChanges();

      expect(breadcrumbEl.querySelectorAll('.ha-breadcrumb__item').length).toBe(6);
      expect(breadcrumbEl.querySelector('.ha-breadcrumb__ellipsis')).toBeNull();
    });

    it('does not collapse when there is nothing left to hide (total <= maxVisible + 1)', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = SIX_ITEMS;
      host.maxVisible = 5;
      fixture.detectChanges();

      expect(breadcrumbEl.querySelectorAll('.ha-breadcrumb__item').length).toBe(6);
      expect(breadcrumbEl.querySelector('.ha-breadcrumb__ellipsis')).toBeNull();
    });

    it('keeps the last item as aria-current="page" and never a link when collapsed', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = SIX_ITEMS;
      host.maxVisible = 3;
      fixture.detectChanges();

      const current = breadcrumbEl.querySelector('.ha-breadcrumb__current')!;
      expect(current.getAttribute('aria-current')).toBe('page');
      expect(current.textContent).toContain('Actual');
    });
  });

  // -----------------------------------------------------------------------
  // Collapse overlay open/close
  // -----------------------------------------------------------------------
  describe('collapse overlay open/close', () => {
    let overlayContainer: OverlayContainer;
    let containerEl: HTMLElement;

    beforeEach(() => {
      overlayContainer = TestBed.inject(OverlayContainer);
      containerEl = overlayContainer.getContainerElement();
    });

    afterEach(() => {
      overlayContainer.ngOnDestroy();
    });

    function getOverlayList(): HTMLElement | null {
      return containerEl.querySelector('.ha-breadcrumb__overlay-list');
    }

    function setupCollapsed(): {
      fixture: ComponentFixture<TestHost>;
      ellipsisEl: HTMLButtonElement;
    } {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = SIX_ITEMS;
      host.maxVisible = 3;
      fixture.detectChanges();
      const ellipsisEl = breadcrumbEl.querySelector(
        '.ha-breadcrumb__ellipsis',
      ) as HTMLButtonElement;
      return { fixture, ellipsisEl };
    }

    it('does not render the overlay while closed', () => {
      const { fixture } = setupCollapsed();
      fixture.detectChanges();

      expect(getOverlayList()).toBeNull();
    });

    it('opens the overlay with the hidden intermediate items when the ellipsis is clicked', () => {
      const { fixture, ellipsisEl } = setupCollapsed();

      ellipsisEl.click();
      fixture.detectChanges();

      const list = getOverlayList();
      expect(list).not.toBeNull();
      const overlayItems = list!.querySelectorAll('.ha-breadcrumb__overlay-item');
      expect(overlayItems.length).toBe(2);
      expect(list!.textContent).toContain('Nivel 3');
      expect(list!.textContent).toContain('Nivel 4');
      expect(list!.textContent).not.toContain('Inicio');
      expect(list!.textContent).not.toContain('Nivel 1');
      expect(list!.textContent).not.toContain('Nivel 2');
      expect(list!.textContent).not.toContain('Actual');
    });

    it('sets aria-expanded on the ellipsis trigger to match open state', () => {
      const { fixture, ellipsisEl } = setupCollapsed();
      expect(ellipsisEl.getAttribute('aria-expanded')).toBe('false');

      ellipsisEl.click();
      fixture.detectChanges();

      expect(ellipsisEl.getAttribute('aria-expanded')).toBe('true');
    });

    it('toggles closed when the ellipsis is clicked again', () => {
      const { fixture, ellipsisEl } = setupCollapsed();
      ellipsisEl.click();
      fixture.detectChanges();
      expect(getOverlayList()).not.toBeNull();

      ellipsisEl.click();
      fixture.detectChanges();

      expect(getOverlayList()).toBeNull();
    });

    it('closes on outside click', () => {
      const { fixture, ellipsisEl } = setupCollapsed();
      ellipsisEl.click();
      fixture.detectChanges();
      expect(getOverlayList()).not.toBeNull();

      document.body.click();
      fixture.detectChanges();

      expect(getOverlayList()).toBeNull();
    });

    it('closes on Escape', () => {
      const { fixture, ellipsisEl } = setupCollapsed();
      ellipsisEl.click();
      fixture.detectChanges();
      expect(getOverlayList()).not.toBeNull();

      dispatchKeydown(ellipsisEl, 'Escape', ESCAPE);
      fixture.detectChanges();

      expect(getOverlayList()).toBeNull();
    });

    it('closes when a linked item inside the overlay is clicked', () => {
      const { fixture, ellipsisEl } = setupCollapsed();
      ellipsisEl.click();
      fixture.detectChanges();

      const overlayLink = getOverlayList()!.querySelector('a.ha-breadcrumb__link') as HTMLElement;
      overlayLink.click();
      fixture.detectChanges();

      expect(getOverlayList()).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // Size classes
  // -----------------------------------------------------------------------
  describe('size classes', () => {
    it('should apply ha-breadcrumb--md by default', () => {
      const { fixture, breadcrumbEl } = createTestHost();
      fixture.detectChanges();

      expect(breadcrumbEl.classList.contains('ha-breadcrumb--md')).toBe(true);
    });

    it('should apply ha-breadcrumb--sm when size is sm', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.size = 'sm';
      fixture.detectChanges();

      expect(breadcrumbEl.classList.contains('ha-breadcrumb--sm')).toBe(true);
    });

    it('should apply ha-breadcrumb--lg when size is lg', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.size = 'lg';
      fixture.detectChanges();

      expect(breadcrumbEl.classList.contains('ha-breadcrumb--lg')).toBe(true);
    });

    it('should NOT have classes for other sizes', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.size = 'sm';
      fixture.detectChanges();

      expect(breadcrumbEl.classList.contains('ha-breadcrumb--md')).toBe(false);
      expect(breadcrumbEl.classList.contains('ha-breadcrumb--lg')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Architectural compliance
  // -----------------------------------------------------------------------
  describe('architectural compliance', () => {
    it('should be a standalone component', () => {
      const { fixture } = createTestHost();
      fixture.detectChanges();

      const breadcrumbDebug = fixture.debugElement.query(By.directive(HaBreadcrumb));
      expect(breadcrumbDebug!.componentInstance).toBeDefined();
    });

    it('should react to input changes (signal inputs, OnPush)', () => {
      const { fixture, host, breadcrumbEl } = createTestHost();
      fixture.detectChanges();

      host.size = 'lg';
      fixture.detectChanges();

      expect(breadcrumbEl.classList.contains('ha-breadcrumb--lg')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Accessibility (jest-axe)
  // -----------------------------------------------------------------------
  describe('accessibility', () => {
    it('should have no accessibility violations with links and a current page', async () => {
      const { fixture } = createTestHost();
      fixture.detectChanges();

      const results = await axe(fixture.nativeElement);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with a single item', async () => {
      const { fixture, host } = createTestHost();
      host.items = [{ label: 'Solo' }];
      fixture.detectChanges();

      const results = await axe(fixture.nativeElement);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations with no links at all', async () => {
      const { fixture, host } = createTestHost();
      host.items = [{ label: 'Uno' }, { label: 'Dos' }, { label: 'Tres' }];
      fixture.detectChanges();

      const results = await axe(fixture.nativeElement);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations while collapsed with the overlay open', async () => {
      const overlayContainer = TestBed.inject(OverlayContainer);
      const { fixture, host, breadcrumbEl } = createTestHost();
      host.items = SIX_ITEMS;
      host.maxVisible = 3;
      fixture.detectChanges();

      const ellipsisEl = breadcrumbEl.querySelector(
        '.ha-breadcrumb__ellipsis',
      ) as HTMLButtonElement;
      ellipsisEl.click();
      fixture.detectChanges();

      // Scoped to document.body (NOT fixture.nativeElement): the CDK overlay
      // renders outside the fixture root — see `select.component.spec.ts`'s
      // equivalent test for the same rationale. "region" disabled for the
      // same reason (no page landmarks in the test root).
      const results = await axe(document.body, { rules: { region: { enabled: false } } });
      expect(results).toHaveNoViolations();

      overlayContainer.ngOnDestroy();
    });
  });
});
