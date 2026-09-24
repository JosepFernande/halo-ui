import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface ShowcaseFooterLink {
  readonly path: string;
  readonly label: string;
  readonly hint: string;
  readonly icon: 'prev' | 'next' | 'home';
}

/**
 * Prev/next navigation cards at the bottom of showcase component pages.
 * A null link omits its card.
 */
@Component({
  selector: 'app-showcase-page-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './page-footer.component.html',
  styleUrl: './page-footer.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageFooterComponent {
  readonly prevLink = input<ShowcaseFooterLink | null>(null);
  readonly nextLink = input<ShowcaseFooterLink | null>(null);
}
