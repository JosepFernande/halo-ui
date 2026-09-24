import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ApiTableComponent, type ShowcaseApiRow } from './api-table.component';

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

const rows: ShowcaseApiRow[] = [
  {
    name: 'variant',
    type: `'solid' | 'outline'`,
    default: `'solid'`,
    description: 'Visual variant.',
  },
  { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Component size.' },
];

@Component({
  selector: 'app-test-api-table-full',
  standalone: true,
  imports: [ApiTableComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <app-showcase-api-table [rows]="rows">
      <p data-testid="subcontent">Outputs paragraph</p>
    </app-showcase-api-table>
  `,
})
class TestHost {
  readonly rows = rows;
}

@Component({
  selector: 'app-test-api-table-no-slot',
  standalone: true,
  imports: [ApiTableComponent],
  encapsulation: ViewEncapsulation.None,
  template: ` <app-showcase-api-table [rows]="rows" /> `,
})
class NoSlotHost {
  readonly rows = rows;
}

describe('ShowcaseApiTable', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost, NoSlotHost],
    }).compileComponents();
  });

  describe('rendering', () => {
    it('should render all four columns for each row', () => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();

      const cells = fixture.debugElement.queryAll(By.css('tbody td'));
      expect(cells).toHaveLength(8);

      const firstRowTexts = cells.slice(0, 4).map((cell) => cell.nativeElement.textContent.trim());
      expect(firstRowTexts).toEqual([
        'variant',
        `'solid' | 'outline'`,
        `'solid'`,
        'Visual variant.',
      ]);

      const secondRowTexts = cells.slice(4, 8).map((cell) => cell.nativeElement.textContent.trim());
      expect(secondRowTexts).toEqual(['size', `'sm' | 'md' | 'lg'`, `'md'`, 'Component size.']);
    });

    it('should project subsection content when provided', () => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();

      const subcontent = fixture.debugElement.query(By.css('[data-testid="subcontent"]'));
      expect(subcontent).toBeTruthy();
      expect(subcontent.nativeElement.textContent).toBe('Outputs paragraph');
    });

    it('should omit the slot container when no subsection content is projected', () => {
      const fixture = TestBed.createComponent(NoSlotHost);
      fixture.detectChanges();

      const slot = fixture.debugElement.query(By.css('[data-testid="subsections"]'));
      expect(slot).toBeNull();
    });
  });

  describe('architectural compliance', () => {
    it('should be standalone and OnPush', () => {
      const metadata = (
        ApiTableComponent as unknown as { ɵcmp: { standalone: boolean; onPush: boolean } }
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
