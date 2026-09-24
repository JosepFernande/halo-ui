import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { CodeBlockComponent } from '../../code-block/code-block.component';

export type ShowcasePlaygroundTab = 'preview' | 'code';

/**
 * Shared interactive playground shell.
 * Owns the preview/code tab toggle and the code pane; the preview, controls sidebar
 * and any extra blocks are projected by the consuming page.
 */
@Component({
  selector: 'app-showcase-playground',
  standalone: true,
  imports: [CodeBlockComponent],
  templateUrl: './playground.component.html',
  styleUrl: './playground.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaygroundComponent {
  readonly activeTab = input.required<ShowcasePlaygroundTab>();
  readonly code = input.required<string>();
  readonly tabChange = output<ShowcasePlaygroundTab>();

  protected selectTab(tab: ShowcasePlaygroundTab): void {
    if (tab !== this.activeTab()) {
      this.tabChange.emit(tab);
    }
  }
}
