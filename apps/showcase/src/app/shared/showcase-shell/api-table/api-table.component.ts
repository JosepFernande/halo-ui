import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

export interface ShowcaseApiRow {
  readonly name: string;
  readonly type: string;
  readonly default: string;
  readonly description: string;
}

/**
 * Renders the Inputs API reference table for a showcase page.
 * Additional outputs/slots/events subsections are projected via the default slot.
 */
@Component({
  selector: 'app-showcase-api-table',
  standalone: true,
  templateUrl: './api-table.component.html',
  styleUrl: './api-table.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiTableComponent {
  readonly rows = input.required<readonly ShowcaseApiRow[]>();
}
