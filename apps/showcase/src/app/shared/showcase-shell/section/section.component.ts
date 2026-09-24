import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

/**
 * Wraps a page section with an optional heading and anchor id.
 * The default slot receives the section body.
 */
@Component({
  selector: 'app-showcase-section',
  standalone: true,
  templateUrl: './section.component.html',
  styleUrl: './section.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionComponent {
  readonly heading = input<string>();
  readonly id = input<string>();
}
