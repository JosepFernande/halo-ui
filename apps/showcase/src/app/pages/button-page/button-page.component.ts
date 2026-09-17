import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HaButton } from '@halolib-ui/angular/button';
import type { HaButtonSize, HaButtonVariant } from '@halolib-ui/angular/button';
import { HaBreadcrumb } from '@halolib-ui/angular/breadcrumb';
import type { HaBreadcrumbItem } from '@halolib-ui/angular/breadcrumb';
import { HA_BUTTON_DIMENSIONS } from '@halolib-ui/angular/core';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';

/** One real theme color usable via `[color]`, paired with its resolved hex for display. */
interface ColorSwatch {
  readonly name: string;
  readonly hex: string;
}

/** One real `variant` value with short guidance on when to reach for it. */
interface VariantInfo {
  readonly variant: HaButtonVariant;
  readonly title: string;
  readonly description: string;
}

/** One real `size` value with its dimensions, read straight from `HA_BUTTON_DIMENSIONS`. */
interface SizeInfo {
  readonly size: HaButtonSize;
  readonly minHeight: string;
  readonly minWidth: string;
}

/** One row of the real `HaButton` Inputs API reference table. */
interface ApiInput {
  readonly name: string;
  readonly type: string;
  readonly default: string;
  readonly description: string;
}

/** Showcase playground for `ha-button` (`libs/button`): variants, sizes, colors, and states. */
@Component({
  selector: 'app-button-page',
  standalone: true,
  imports: [RouterLink, HaButton, HaBreadcrumb, CodeBlockComponent],
  templateUrl: './button-page.component.html',
  styleUrl: './button-page.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonPageComponent {
  protected readonly breadcrumbItems: HaBreadcrumbItem[] = [
    { label: 'Documentación', link: '/instalacion' },
    { label: 'Componentes', link: '/componentes/boton' },
    { label: 'Botón' },
  ];

  protected readonly variants: readonly HaButtonVariant[] = ['solid', 'outline', 'ghost'];
  protected readonly sizes: readonly HaButtonSize[] = ['sm', 'md', 'lg'];
  protected readonly colors: readonly string[] = ['primary', 'success', 'error'];

  /** Color roster for Section 2 — every `DEFAULT_THEME` entry demoed on the current button-page, plus its resolved hex. */
  protected readonly colorSwatches: readonly ColorSwatch[] = [
    { name: 'primary', hex: '#4f46e5' },
    { name: 'success', hex: '#8fbf21' },
    { name: 'error', hex: '#d71608' },
    { name: 'warning', hex: '#ed9613' },
    { name: 'info', hex: '#16a3c3' },
    { name: 'neutral', hex: '#4c4c4c' },
  ];

  /** The 3 real variants with short real-world guidance on when to use each. */
  protected readonly variantInfo: readonly VariantInfo[] = [
    {
      variant: 'solid',
      title: 'Solid',
      description: 'Fondo sólido. Para la acción principal de la pantalla.',
    },
    {
      variant: 'outline',
      title: 'Outline',
      description: 'Borde sin relleno. Para una acción secundaria.',
    },
    {
      variant: 'ghost',
      title: 'Ghost',
      description: 'Sin fondo ni borde. Para una acción terciaria de bajo énfasis.',
    },
  ];

  /** The 3 real sizes with their `min-height`/`min-width`, sourced directly from `HA_BUTTON_DIMENSIONS`. */
  protected readonly sizeInfo: readonly SizeInfo[] = this.sizes.map((size) => ({
    size,
    minHeight: HA_BUTTON_DIMENSIONS[size].minHeight,
    minWidth: HA_BUTTON_DIMENSIONS[size].minWidth,
  }));

  /** The real 6-input `HaButton` API surface — no more, no less. */
  protected readonly apiInputs: readonly ApiInput[] = [
    {
      name: 'variant',
      type: `'solid' | 'outline' | 'ghost'`,
      default: `'solid'`,
      description: 'Variante visual del botón.',
    },
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Tamaño del botón.' },
    {
      name: 'color',
      type: 'string',
      default: `'primary'`,
      description: 'Nombre de color registrado en el Theme Engine.',
    },
    { name: 'disabled', type: 'boolean', default: 'false', description: 'Deshabilita el botón.' },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      description: 'Muestra el spinner interno y oculta la etiqueta mientras está activo.',
    },
    {
      name: 'type',
      type: `'button' | 'submit' | 'reset'`,
      default: `'button'`,
      description: 'Atributo `type` nativo del botón.',
    },
  ];

  // --- Interactive Playground state (Section 1) ---

  protected readonly selectedVariant = signal<HaButtonVariant>('solid');
  protected readonly selectedSize = signal<HaButtonSize>('md');
  protected readonly selectedColor = signal('primary');
  protected readonly withLoading = signal(false);
  protected readonly withDisabled = signal(false);
  protected readonly activeTab = signal<'preview' | 'code'>('preview');

  /** Real `<button ha-button>` markup reflecting the playground's current selections. */
  protected readonly generatedCode = computed(() => {
    const attrs = [
      `variant="${this.selectedVariant()}"`,
      `size="${this.selectedSize()}"`,
      `color="${this.selectedColor()}"`,
    ];
    if (this.withLoading()) {
      attrs.push('[loading]="true"');
    }
    if (this.withDisabled()) {
      attrs.push('[disabled]="true"');
    }
    return `<button ha-button ${attrs.join(' ')}>Acción</button>`;
  });

  protected onLoadingToggle(event: Event): void {
    this.withLoading.set((event.target as HTMLInputElement).checked);
  }

  protected onDisabledToggle(event: Event): void {
    this.withDisabled.set((event.target as HTMLInputElement).checked);
  }
}
