import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

export interface ShowcaseJumpLink {
  readonly href: string;
  readonly label: string;
}

/**
 * Page header shared across showcase component pages.
 * Renders a selector badge, status badge, jump links,
 * and projected `[breadcrumb]` and `[description]` slots.
 */
@Component({
  selector: 'app-showcase-page-header',
  standalone: true,
  templateUrl: './page-header.component.html',
  styleUrl: './page-header.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeaderComponent {
  readonly selector = input.required<string>();
  readonly statusBadge = input.required<string>();
  readonly jumpLinks = input.required<ShowcaseJumpLink[]>();
}
