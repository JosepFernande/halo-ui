import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SectionComponent } from './section.component';

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

@Component({
  selector: 'app-test-section-full',
  standalone: true,
  imports: [SectionComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <app-showcase-section heading="Variants" id="variants">
      <p>Projected content</p>
    </app-showcase-section>
  `,
})
class TestHost {}

@Component({
  selector: 'app-test-section-no-heading',
  standalone: true,
  imports: [SectionComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <app-showcase-section>
      <p>No heading section</p>
    </app-showcase-section>
  `,
})
class NoHeadingHost {}

describe('ShowcaseSection', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost, NoHeadingHost],
    }).compileComponents();
  });

  describe('rendering', () => {
    it('should render the heading, id anchor and projected content', () => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();

      const section = fixture.debugElement.query(By.css('section')).nativeElement as HTMLElement;
      const heading = fixture.debugElement.query(By.css('h2')).nativeElement as HTMLHeadingElement;
      const paragraph = fixture.debugElement.query(By.css('p'))
        .nativeElement as HTMLParagraphElement;

      expect(section.id).toBe('variants');
      expect(section.classList.contains('scroll-mt-6')).toBe(true);
      expect(heading.textContent).toBe('Variants');
      expect(paragraph.textContent).toBe('Projected content');
    });

    it('should render projected content without a heading', () => {
      const fixture = TestBed.createComponent(NoHeadingHost);
      fixture.detectChanges();

      const heading = fixture.debugElement.query(By.css('h2'));
      const paragraph = fixture.debugElement.query(By.css('p'))
        .nativeElement as HTMLParagraphElement;

      expect(heading).toBeNull();
      expect(paragraph.textContent).toBe('No heading section');
    });
  });

  describe('architectural compliance', () => {
    it('should be standalone and OnPush', () => {
      const metadata = (
        SectionComponent as unknown as { ɵcmp: { standalone: boolean; onPush: boolean } }
      ).ɵcmp;
      expect(metadata.standalone).toBe(true);
      expect(metadata.onPush).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations', async () => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
      const results = await axe(fixture.nativeElement);
      expect(results).toHaveNoViolations();
    });
  });
});
