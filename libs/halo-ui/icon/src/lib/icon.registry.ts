import type { LucideIcon } from '@lucide/angular';
import {
  LucideArrowRight,
  LucideArrowLeft,
  LucideChevronDown,
  LucideChevronUp,
  LucideChevronLeft,
  LucideChevronRight,
  LucideCheck,
  LucideX,
  LucidePlus,
  LucideMinus,
  LucideSearch,
  LucideMenu,
  LucideInfo,
  LucideTriangleAlert,
  LucideCircleAlert,
  LucideCircleCheckBig,
  LucideCircleX,
  LucideHouse,
  LucideSettings,
  LucideUser,
  LucideMail,
  LucideCalendar,
  LucideClock,
  LucideTrash,
  LucidePencil,
  LucideEye,
  LucideEyeOff,
  LucideCopy,
  LucideExternalLink,
  LucideEllipsis,
} from '@lucide/angular';

/**
 * Curated map of icon names (Lucide's own kebab-case slugs, e.g.
 * https://lucide.dev/icons/circle-check-big) to the Lucide Angular icon
 * component that renders them.
 *
 * Consumers must depend on `@halolib-ui/angular/icon`'s `name` input rather
 * than importing `@lucide/angular` icon components directly, so the
 * underlying icon set can be swapped later without a breaking change.
 *
 * A few candidate names from the original brief were renamed upstream by
 * Lucide and re-exported only as deprecated aliases; this registry uses the
 * current canonical export and slug instead of the deprecated one:
 * - `AlertTriangle` -> `LucideTriangleAlert` / `triangle-alert`
 * - `AlertCircle` -> `LucideCircleAlert` / `circle-alert`
 * - `CheckCircle` -> `LucideCircleCheckBig` / `circle-check-big`
 * - `XCircle` -> `LucideCircleX` / `circle-x`
 * - `Trash2` -> `LucideTrash` / `trash`
 * - `Home` -> `LucideHouse` / `house`
 */
export const HA_ICON_REGISTRY = {
  'arrow-right': LucideArrowRight,
  'arrow-left': LucideArrowLeft,
  'chevron-down': LucideChevronDown,
  'chevron-up': LucideChevronUp,
  'chevron-left': LucideChevronLeft,
  'chevron-right': LucideChevronRight,
  check: LucideCheck,
  x: LucideX,
  plus: LucidePlus,
  minus: LucideMinus,
  search: LucideSearch,
  menu: LucideMenu,
  info: LucideInfo,
  'triangle-alert': LucideTriangleAlert,
  'circle-alert': LucideCircleAlert,
  'circle-check-big': LucideCircleCheckBig,
  'circle-x': LucideCircleX,
  house: LucideHouse,
  settings: LucideSettings,
  user: LucideUser,
  mail: LucideMail,
  calendar: LucideCalendar,
  clock: LucideClock,
  trash: LucideTrash,
  pencil: LucidePencil,
  eye: LucideEye,
  'eye-off': LucideEyeOff,
  copy: LucideCopy,
  'external-link': LucideExternalLink,
  ellipsis: LucideEllipsis,
} satisfies Record<string, LucideIcon>;

export type HaIconName = keyof typeof HA_ICON_REGISTRY;

/** Stable, alphabetically-sorted list of every registered icon name. */
export const HA_ICON_NAMES: readonly HaIconName[] = Object.keys(
  HA_ICON_REGISTRY,
).sort() as HaIconName[];
