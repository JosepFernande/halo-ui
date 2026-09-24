import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PageHeaderComponent, type ShowcaseJumpLink } from './page-header.component';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { axe, toHaveNoViolations } = require('jest-axe') as {
  axe: (element: Element | Document) => Promise<Record<string, unknown>>;
  toHaveNoViolations: Record<string, jest.CustomMatcher>;
};
expect.extend(toHaveNoViolations);

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

const jumpLinks: ShowcaseJumpLink[] = [
  { href: '#playground', label: 'Playground' },
  { href: '#api-reference', label: 'API Docs' },
];

@Component({
  selector: 'app-test-page-header-full',
  standalone: true,
  imports: [PageHeaderComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <app-showcase-page-header
      selector="<button ha-button>"
      statusBadge="Signals Ready"
      [jumpLinks]="jumpLinks"
    >
      <span breadcrumb data-testid="breadcrumb">Breadcrumb</span>
      <ng-container description><strong>Description</strong> with <code>code</code>.</ng-container>
    </app-showcase-page-header>
  `,
})
class FullHeaderHost {
  readonly jumpLinks = jumpLinks;
}

@Component({
  selector: 'app-test-page-header-empty',
  standalone: true,
  imports: [PageHeaderComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <app-showcase-page-header selector="<ha-icon />" statusBadge="Ready" [jumpLinks]="[]">
      <ng-container description>No links</ng-container>
    </app-showcase-page-header>
  `,
})
class EmptyLinksHost {}

describe('ShowcasePageHeader', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FullHeaderHost, EmptyLinksHost],
    }).compileComponents();
  });

  describe('rendering', () => {
    it('should render selector badge, status badge, description and jump links', () => {
      const fixture = TestBed.createComponent(FullHeaderHost);
      fixture.detectChanges();

      const selectorCode = fixture.debugElement.query(By.css('code')).nativeElement as HTMLElement;
      const statusBadge = fixture.debugElement.query(By.css('span.rounded-full'))
        .nativeElement as HTMLElement;
      const description = fixture.debugElement.query(By.css('p.max-w-3xl'))
        .nativeElement as HTMLElement;
      const links = fixture.debugElement.queryAll(By.css('a[href^="#"]'));
      const breadcrumb = fixture.debugElement.query(By.css('[data-testid="breadcrumb"]'));

      expect(selectorCode.textContent).toContain('<button ha-button>');
      expect(statusBadge.textContent).toBe('Signals Ready');
      expect(description.innerHTML).toContain('<strong>Description</strong>');
      expect(description.innerHTML).toContain('<code>code</code>');
      expect(links).toHaveLength(2);
      expect(links[0].nativeElement.getAttribute('href')).toBe('#playground');
      expect(links[0].nativeElement.textContent).toContain('Playground');
      expect(links[1].nativeElement.getAttribute('href')).toBe('#api-reference');
      expect(breadcrumb.nativeElement.textContent).toBe('Breadcrumb');
    });

    it('should render no jump-link anchors when jumpLinks is empty', () => {
      const fixture = TestBed.createComponent(EmptyLinksHost);
      fixture.detectChanges();

      const links = fixture.debugElement.queryAll(By.css('a[href^="#"]'));
      expect(links).toHaveLength(0);
    });
  });

  describe('architectural compliance', () => {
    it('should be standalone and OnPush', () => {
      const metadata = (
        PageHeaderComponent as unknown as { ɵcmp: { standalone: boolean; onPush: boolean } }
      ).ɵcmp;
      expect(metadata.standalone).toBe(true);
      expect(metadata.onPush).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations', async () => {
      const fixture = TestBed.createComponent(FullHeaderHost);
      fixture.detectChanges();
      const results = await axe(fixture.nativeElement);
      expect(results).toHaveNoViolations();
    });
  });
});
