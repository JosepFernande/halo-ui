import { Component, ViewEncapsulation, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PlaygroundComponent } from './playground.component';

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
  selector: 'app-test-playground',
  standalone: true,
  imports: [PlaygroundComponent],
  encapsulation: ViewEncapsulation.None,
  template: `
    <app-showcase-playground
      [activeTab]="activeTab()"
      [code]="'<button>Code</button>'"
      (tabChange)="activeTab.set($event)"
    >
      <div preview data-testid="preview-pane">Preview content</div>
      <div controls data-testid="controls-pane">Controls content</div>
      <p data-testid="extra-content">Extra block</p>
    </app-showcase-playground>
  `,
})
class TestHost {
  readonly activeTab = signal<'preview' | 'code'>('preview');
}

describe('ShowcasePlayground', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
  });

  describe('rendering', () => {
    it('should render the preview pane by default', () => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();

      const preview = fixture.debugElement.query(By.css('[data-testid="preview-pane"]'));
      const codeBlock = fixture.debugElement.query(By.css('app-code-block'));

      expect(preview).toBeTruthy();
      expect(preview.nativeElement.textContent).toBe('Preview content');
      expect(codeBlock).toBeNull();
    });

    it('should render the code pane when activeTab is code', () => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.activeTab.set('code');
      fixture.detectChanges();

      const preview = fixture.debugElement.query(By.css('[data-testid="preview-pane"]'));
      const codeBlock = fixture.debugElement.query(By.css('app-code-block'));

      expect(preview).toBeNull();
      expect(codeBlock).toBeTruthy();
    });

    it('should project controls and extra content', () => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();

      const controls = fixture.debugElement.query(By.css('[data-testid="controls-pane"]'));
      const extra = fixture.debugElement.query(By.css('[data-testid="extra-content"]'));

      expect(controls).toBeTruthy();
      expect(controls.nativeElement.textContent).toBe('Controls content');
      expect(extra).toBeTruthy();
      expect(extra.nativeElement.textContent).toBe('Extra block');
    });
  });

  describe('interaction', () => {
    it('should emit tabChange and swap panes when Code is clicked', () => {
      const fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();

      const codeButton = fixture.debugElement.queryAll(By.css('button[type="button"]'))[1];
      codeButton.triggerEventHandler('click', null);
      fixture.detectChanges();

      expect(fixture.componentInstance.activeTab()).toBe('code');
      expect(fixture.debugElement.query(By.css('app-code-block'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('[data-testid="preview-pane"]'))).toBeNull();
    });
  });

  describe('architectural compliance', () => {
    it('should be standalone and OnPush', () => {
      const metadata = (
        PlaygroundComponent as unknown as { ɵcmp: { standalone: boolean; onPush: boolean } }
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
