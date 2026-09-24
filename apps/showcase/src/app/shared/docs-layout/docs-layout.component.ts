import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { LIBRARY_VERSION } from '../../const/library-version';

/** Docs-only chrome: sidebar nav + router outlet wrapping the install/config/component playground routes. */
@Component({
  selector: 'app-docs-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './docs-layout.component.html',
  styleUrl: './docs-layout.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocsLayoutComponent {
  protected readonly sidebarOpen = signal(false);
  protected readonly libraryVersion = LIBRARY_VERSION;

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  protected closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}
