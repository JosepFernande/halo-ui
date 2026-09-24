import { ChangeDetectionStrategy, Component, ViewEncapsulation, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { INSTALL_COMMAND, LIBRARY_VERSION } from '../../const/library-version';

/** Showcase landing page: marketing hero, value proposition and docs entry points for halo-ui. */
@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  /** Whether the install command was just copied to the clipboard (resets after ~2s). */
  protected readonly copied = signal(false);

  protected readonly libraryVersion = LIBRARY_VERSION;

  private copyResetTimeout?: ReturnType<typeof setTimeout>;

  protected copyInstallCommand(): void {
    navigator.clipboard.writeText(INSTALL_COMMAND).then(() => {
      this.copied.set(true);
      clearTimeout(this.copyResetTimeout);
      this.copyResetTimeout = setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
