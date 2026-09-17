import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HaBreadcrumb } from '@halolib-ui/angular/breadcrumb';
import type { HaBreadcrumbItem, HaBreadcrumbSize } from '@halolib-ui/angular/breadcrumb';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';

/** One row of the real `HaBreadcrumb` Inputs API reference table. */
interface ApiInput {
  readonly name: string;
  readonly type: string;
  readonly default: string;
  readonly description: string;
}

/** Showcase playground for `ha-breadcrumb` (`libs/halo-ui/breadcrumb`). */
@Component({
  selector: 'app-breadcrumb-page',
  standalone: true,
  imports: [RouterLink, HaBreadcrumb, CodeBlockComponent],
  templateUrl: './breadcrumb-page.component.html',
  styleUrl: './breadcrumb-page.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbPageComponent {
  protected readonly breadcrumbItems: HaBreadcrumbItem[] = [
    { label: 'Documentación', link: '/instalacion' },
    { label: 'Componentes', link: '/componentes/boton' },
    { label: 'Breadcrumb' },
  ];

  protected readonly sizes: readonly HaBreadcrumbSize[] = ['sm', 'md', 'lg'];

  /** The real 5-input `HaBreadcrumb` API surface — no more, no less. */
  protected readonly apiInputs: readonly ApiInput[] = [
    {
      name: 'items',
      type: 'HaBreadcrumbItem[]',
      default: 'required',
      description:
        '`{ label: string; link?: string | unknown[]; icon?: HaIconName }[]` — el recorrido, de la raíz a la página actual. `icon` es opcional y se renderiza antes del label.',
    },
    {
      name: 'size',
      type: `'sm' | 'md' | 'lg'`,
      default: `'md'`,
      description: 'Tamaño del texto y del espaciado entre items.',
    },
    {
      name: 'separator',
      type: 'string',
      default: `'/'`,
      description: 'Contenido del separador renderizado entre items (no después del último).',
    },
    {
      name: 'maxVisible',
      type: 'number | undefined',
      default: 'undefined',
      description:
        'Muestra los primeros N items + "…" + el último cuando la cantidad total los supera. Debe ser un entero positivo — 0, negativo o con decimales no colapsan (se muestran todos). El "…" abre un overlay con los items intermedios.',
    },
  ];

  // --- Interactive Playground state (Section 1) ---

  protected readonly selectedSize = signal<HaBreadcrumbSize>('md');
  protected readonly separator = signal('/');
  protected readonly selectedMaxVisible = signal<number | undefined>(undefined);
  protected readonly activeTab = signal<'preview' | 'code'>('preview');

  protected readonly playgroundItems: HaBreadcrumbItem[] = [
    { label: 'Inicio', link: '/', icon: 'house' },
    { label: 'Documentación', link: '/instalacion' },
    { label: 'Componentes', link: '/componentes/boton' },
    { label: 'Select', link: '/componentes/select' },
    { label: 'Iconos', link: '/componentes/iconos' },
    { label: 'Breadcrumb' },
  ];

  /** A longer trail dedicated to the "Casos reales" collapse demo (Section 2). */
  protected readonly longTrailItems: HaBreadcrumbItem[] = [
    { label: 'Inicio', link: '/', icon: 'house' },
    { label: 'Documentación', link: '/instalacion' },
    { label: 'Componentes', link: '/componentes/boton' },
    { label: 'Select', link: '/componentes/select' },
    { label: 'Iconos', link: '/componentes/iconos' },
    { label: 'Breadcrumb' },
  ];

  /** Real `<ha-breadcrumb>` markup reflecting the playground's current selections. */
  protected readonly generatedCode = computed(() => {
    const maxVisible = this.selectedMaxVisible();
    const attrs = [`size="${this.selectedSize()}"`, `separator="${this.separator()}"`];
    if (maxVisible !== undefined) {
      attrs.push(`[maxVisible]="${maxVisible}"`);
    }
    return `<ha-breadcrumb
  [items]="items"
  ${attrs.join('\n  ')}
/>`;
  });

  protected onSeparatorInput(event: Event): void {
    this.separator.set((event.target as HTMLInputElement).value);
  }

  protected onMaxVisibleInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.selectedMaxVisible.set(raw === '' ? undefined : Number(raw));
  }
}
