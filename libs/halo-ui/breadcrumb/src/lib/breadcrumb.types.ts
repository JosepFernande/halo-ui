import type { HaIconName } from '@halolib-ui/angular/icon';

/** A single breadcrumb entry. `link` is ignored on the last item — it always renders as the current page. */
export interface HaBreadcrumbItem {
  readonly label: string;
  readonly link?: string | unknown[];
  /** Optional icon (`HA_ICON_NAMES`), rendered before the label. */
  readonly icon?: HaIconName;
}

export type HaBreadcrumbSize = 'sm' | 'md' | 'lg';
