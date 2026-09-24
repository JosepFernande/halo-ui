import { Component, ViewEncapsulation } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { PageFooterComponent, type ShowcaseFooterLink } from './page-footer.component';

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

const prevLink: ShowcaseFooterLink = {
  path: '/componentes/boton',
  label: 'Botón',
  hint: 'Anterior',
  icon: 'prev',
};

const nextLink: ShowcaseFooterLink = {
  path: '/componentes/select',
  label: 'Select',
  hint: 'Siguiente',
  icon: 'next',
};

const homeLink: ShowcaseFooterLink = {
  path: '/',
  label: 'Volver al inicio',
  hint: 'Fin del recorrido',
  icon: 'home',
};

@Component({
  selector: 'app-test-page-footer-both',
  standalone: true,
  imports: [PageFooterComponent],
  encapsulation: ViewEncapsulation.None,
  template: ` <app-showcase-page-footer [prevLink]="prevLink" [nextLink]="nextLink" /> `,
})
class BothLinksHost {
  readonly prevLink = prevLink;
  readonly nextLink = nextLink;
}

@Component({
  selector: 'app-test-page-footer-prev',
  standalone: true,
  imports: [PageFooterComponent],
  encapsulation: ViewEncapsulation.None,
  template: ` <app-showcase-page-footer [prevLink]="prevLink" [nextLink]="null" /> `,
})
class OnlyPrevHost {
  readonly prevLink = prevLink;
}

@Component({
  selector: 'app-test-page-footer-next',
  standalone: true,
  imports: [PageFooterComponent],
  encapsulation: ViewEncapsulation.None,
  template: ` <app-showcase-page-footer [prevLink]="null" [nextLink]="homeLink" /> `,
})
class OnlyNextHost {
  readonly homeLink = homeLink;
}

describe('ShowcasePageFooter', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BothLinksHost, OnlyPrevHost, OnlyNextHost],
      providers: [provideRouter([]), provideLocationMocks()],
    }).compileComponents();
  });

  describe('rendering', () => {
    it('should render prev and next navigation cards', () => {
      const fixture = TestBed.createComponent(BothLinksHost);
      fixture.detectChanges();

      const links = fixture.debugElement.queryAll(By.css('a'));
      expect(links).toHaveLength(2);

      const prev = links[0].nativeElement as HTMLAnchorElement;
      expect(prev.getAttribute('href')).toBe('/componentes/boton');
      expect(prev.textContent).toContain('Anterior');
      expect(prev.textContent).toContain('Botón');

      const next = links[1].nativeElement as HTMLAnchorElement;
      expect(next.getAttribute('href')).toBe('/componentes/select');
      expect(next.textContent).toContain('Siguiente');
      expect(next.textContent).toContain('Select');
    });

    it('should omit the prev card when prevLink is null', () => {
      const fixture = TestBed.createComponent(OnlyPrevHost);
      fixture.detectChanges();

      const links = fixture.debugElement.queryAll(By.css('a'));
      expect(links).toHaveLength(1);
      expect(links[0].nativeElement.textContent).toContain('Anterior');
    });

    it('should render the home icon variant for the next card', () => {
      const fixture = TestBed.createComponent(OnlyNextHost);
      fixture.detectChanges();

      const links = fixture.debugElement.queryAll(By.css('a'));
      expect(links).toHaveLength(1);
      expect(links[0].nativeElement.textContent).toContain('Fin del recorrido');
      expect(links[0].nativeElement.textContent).toContain('Volver al inicio');
    });
  });

  describe('architectural compliance', () => {
    it('should be standalone and OnPush', () => {
      const metadata = (
        PageFooterComponent as unknown as { ɵcmp: { standalone: boolean; onPush: boolean } }
      ).ɵcmp;
      expect(metadata.standalone).toBe(true);
      expect(metadata.onPush).toBe(true);
    });
  });

  describe('accessibility', () => {
    it('should have no accessibility violations', async () => {
      const fixture = TestBed.createComponent(BothLinksHost);
      fixture.detectChanges();
      const results = await axe(fixture.nativeElement);
      expect(results).toHaveNoViolations();
    });
  });
});
