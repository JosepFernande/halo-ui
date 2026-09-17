import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HA_ICON_NAMES, HaIcon } from '@halolib-ui/angular/icon';
import type { HaIconName, HaIconSize } from '@halolib-ui/angular/icon';
import { HaBreadcrumb } from '@halolib-ui/angular/breadcrumb';
import type { HaBreadcrumbItem } from '@halolib-ui/angular/breadcrumb';
import { HA_ICON_SIZE_SCALE } from '@halolib-ui/angular/core';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';

/** One real `size` value with its pixel dimension, read straight from `HA_ICON_SIZE_SCALE`. */
interface SizeInfo {
  readonly size: HaIconSize;
  readonly px: string;
}

/** One row of the real `HaIcon` Inputs API reference table. */
interface ApiInput {
  readonly name: string;
  readonly type: string;
  readonly default: string;
  readonly description: string;
}

/** Showcase playground for `ha-icon` (`libs/halo-ui/icon`): a Lucide-based, token-sized, currentColor-driven icon wrapper. */
@Component({
  selector: 'app-icon-page',
  standalone: true,
  imports: [RouterLink, HaIcon, HaBreadcrumb, CodeBlockComponent],
  templateUrl: './icon-page.component.html',
  styleUrl: './icon-page.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconPageComponent {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly breadcrumbItems: HaBreadcrumbItem[] = [
    { label: 'Documentación', link: '/instalacion' },
    { label: 'Iconos' },
  ];

  protected readonly sizes: readonly HaIconSize[] = ['sm', 'md', 'lg'];

  /** The 3 real sizes with their pixel dimension, sourced directly from `HA_ICON_SIZE_SCALE`. */
  protected readonly sizeInfo: readonly SizeInfo[] = this.sizes.map((size) => ({
    size,
    px: HA_ICON_SIZE_SCALE[size],
  }));

  /** The real 3-input `HaIcon` API surface — no more, no less. There is no `color` input: color is 100% inherited via `currentColor`. */
  protected readonly apiInputs: readonly ApiInput[] = [
    {
      name: 'name',
      type: 'HaIconName',
      default: '(requerido)',
      description: 'Slug kebab-case del ícono a renderizar, tomado del registro curado de Lucide.',
    },
    {
      name: 'size',
      type: `'sm' | 'md' | 'lg'`,
      default: `'md'`,
      description: `Tamaño del ícono: ${HA_ICON_SIZE_SCALE.sm}, ${HA_ICON_SIZE_SCALE.md} o ${HA_ICON_SIZE_SCALE.lg}.`,
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: `''`,
      description:
        'Vacío (default): ícono decorativo (`aria-hidden="true"`, sin `role`). Con valor: `role="img"` + `aria-label`.',
    },
  ];

  /** Full sorted list of real icon names — source of truth for the gallery below. */
  protected readonly allIconNames: readonly HaIconName[] = HA_ICON_NAMES;

  // --- Interactive Playground state (Section 1) ---

  protected readonly selectedIcon = signal<HaIconName>(
    this.allIconNames[0] ?? ('arrow-right' as HaIconName),
  );
  protected readonly selectedSize = signal<HaIconSize>('md');
  protected readonly activeTab = signal<'preview' | 'code'>('preview');

  /** Real `<ha-icon>` markup reflecting the playground's current selections. */
  protected readonly generatedCode = computed(
    () => `<ha-icon name="${this.selectedIcon()}" size="${this.selectedSize()}" />`,
  );

  // --- Icon Gallery state (Section 2) ---

  protected readonly gallerySearch = signal('');

  /** Names filtered by plain substring match on the search box — no fake category taxonomy, `HaIcon` carries none. */
  protected readonly filteredIconNames = computed(() => {
    const term = this.gallerySearch().trim().toLowerCase();
    if (!term) {
      return this.allIconNames;
    }
    return this.allIconNames.filter((name) => name.includes(term));
  });

  /** Name of the tile whose usage snippet was just copied to the clipboard (resets after ~1.5s). */
  protected readonly copiedIcon = signal<HaIconName | null>(null);

  protected onSearchInput(event: Event): void {
    this.gallerySearch.set((event.target as HTMLInputElement).value);
  }

  /** Selects the clicked icon in the playground above and copies its `<ha-icon>` usage snippet to the clipboard. */
  protected selectIcon(name: HaIconName): void {
    this.selectedIcon.set(name);
    navigator.clipboard
      .writeText(`<ha-icon name="${name}" />`)
      .then(() => {
        this.copiedIcon.set(name);
        const timeoutId = setTimeout(() => this.copiedIcon.set(null), 1500);
        this.destroyRef.onDestroy(() => clearTimeout(timeoutId));
      })
      .catch(() => {
        this.copiedIcon.set(null);
      });
  }
}
