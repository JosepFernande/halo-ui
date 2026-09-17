import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Showcase-local docs sidebar shell: brand block, the docs nav, and the
 * help/footer card — all hardcoded directly in this component's own
 * template (no content projection). Below the `md` breakpoint it renders as
 * a slide-in drawer controlled by `open`; at/above `md` it's always visible.
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  /** Brand title shown next to the logo badge (e.g. "halo-ui"). */
  readonly brandTitle = input('halo-ui');

  /** Muted subtitle/tagline shown under the brand title. */
  readonly brandSubtitle = input('');

  /** Whether the mobile drawer is open. Ignored at/above the `md` breakpoint. */
  readonly open = input(false);

  /** Emits when a nav link is clicked, so the mobile drawer can close itself. */
  readonly linkClicked = output<void>();

  protected onNavClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).closest('a')) {
      this.linkClicked.emit();
    }
  }
}
