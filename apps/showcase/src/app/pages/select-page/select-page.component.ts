import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HaSelect } from '@halolib-ui/angular/select';
import type { HaSelectOption, HaSelectSize } from '@halolib-ui/angular/select';
import { HaBreadcrumb } from '@halolib-ui/angular/breadcrumb';
import type { HaBreadcrumbItem } from '@halolib-ui/angular/breadcrumb';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';
import {
  ApiTableComponent,
  type ShowcaseApiRow,
} from '../../shared/showcase-shell/api-table/api-table.component';
import {
  PageFooterComponent,
  type ShowcaseFooterLink,
} from '../../shared/showcase-shell/page-footer/page-footer.component';
import {
  PageHeaderComponent,
  type ShowcaseJumpLink,
} from '../../shared/showcase-shell/page-header/page-header.component';
import { PlaygroundComponent } from '../../shared/showcase-shell/playground/playground.component';
import { SectionComponent } from '../../shared/showcase-shell/section/section.component';

/** One row of the real `HaSelect` Outputs API reference table. */
interface ApiOutput {
  readonly name: string;
  readonly type: string;
  readonly description: string;
}

/**
 * Showcase playground for `ha-select` (`libs/select`): unlike `button[ha-button]`/
 * `input[ha-input-text]`, this is a custom element with its own trigger button +
 * CDK overlay panel template, real `valueChange`/`opened`/`closed` outputs, AND
 * standard `ControlValueAccessor` forms integration — both work simultaneously.
 */
@Component({
  selector: 'app-select-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HaSelect,
    HaBreadcrumb,
    CodeBlockComponent,
    SectionComponent,
    PlaygroundComponent,
    ApiTableComponent,
    PageHeaderComponent,
    PageFooterComponent,
  ],
  templateUrl: './select-page.component.html',
  styleUrl: './select-page.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectPageComponent {
  protected readonly breadcrumbItems: HaBreadcrumbItem[] = [
    { label: 'Documentación', link: '/instalacion' },
    { label: 'Componentes', link: '/componentes/boton' },
    { label: 'Select' },
  ];

  protected readonly sizes: readonly HaSelectSize[] = ['sm', 'md', 'lg'];

  /** Real demo option list — Cherry ships disabled on purpose, demoing a disabled option for free. */
  protected readonly fruitOptions: HaSelectOption[] = [
    { label: 'Manzana', value: 'apple' },
    { label: 'Banana', value: 'banana' },
    { label: 'Cereza (deshabilitada)', value: 'cherry', disabled: true },
    { label: 'Dátil', value: 'date' },
  ];

  /** The real 7-input `HaSelect` API surface — no more, no less. */
  protected apiInputs: readonly ShowcaseApiRow[] = [
    {
      name: 'options',
      type: 'HaSelectOption[]',
      default: '[]',
      description:
        '`{ label: string; value: T; disabled?: boolean }[]` — datos de las opciones del panel.',
    },
    {
      name: 'size',
      type: `'sm' | 'md' | 'lg'`,
      default: `'md'`,
      description: 'Tamaño del trigger.',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description:
        'Deshabilita el trigger. También se activa solo si el `FormControl` asociado está disabled.',
    },
    {
      name: 'readonly',
      type: 'boolean',
      default: 'false',
      description: 'El trigger sigue siendo focuseable, pero el panel nunca se abre.',
    },
    {
      name: 'placeholder',
      type: 'string',
      default: `''`,
      description: 'Texto mostrado en el trigger mientras no hay opción seleccionada.',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: `''`,
      description: 'Valor del atributo `aria-label` del trigger.',
    },
    {
      name: 'ariaDescribedBy',
      type: 'string',
      default: `''`,
      description: 'Ids separados por coma para `aria-describedby` del trigger.',
    },
  ];

  /** The real 3-output `HaSelect` API surface. */
  protected readonly apiOutputs: readonly ApiOutput[] = [
    {
      name: 'valueChange',
      type: 'EventEmitter<unknown>',
      description:
        'Emite el valor comprometido con Enter, Espacio, Tab, Alt+Flecha-arriba o al hacer click sobre una opción habilitada. Navegar con flechas/Home/End NO emite — solo mueve `aria-activedescendant`.',
    },
    {
      name: 'opened',
      type: 'EventEmitter<void>',
      description: 'Emite exactamente una vez por cada transición de apertura del panel.',
    },
    {
      name: 'closed',
      type: 'EventEmitter<void>',
      description:
        'Emite exactamente una vez por cada transición de cierre del panel (click afuera, Escape, blur o cierre programático) — incluso cuando Escape cancela sin comprometer valor.',
    },
  ];

  protected readonly jumpLinks: ShowcaseJumpLink[] = [
    { href: '#playground', label: 'Playground' },
    { href: '#api-reference', label: 'API Docs' },
  ];

  protected readonly prevLink: ShowcaseFooterLink = {
    path: '/componentes/input-text',
    label: 'InputText',
    hint: 'Anterior',
    icon: 'prev',
  };

  protected readonly nextLink: ShowcaseFooterLink = {
    path: '/',
    label: 'Volver al inicio',
    hint: 'Fin del recorrido',
    icon: 'home',
  };

  // --- Interactive Playground state (Section 1) ---

  protected readonly selectedSize = signal<HaSelectSize>('md');
  protected readonly withDisabled = signal(false);
  protected readonly withReadonly = signal(false);
  protected readonly activeTab = signal<'preview' | 'code'>('preview');

  /** Real live state driven by the playground `ha-select`'s own `(valueChange)`/`(opened)`/`(closed)` outputs. */
  protected readonly selectedValue = signal<unknown>(null);
  protected readonly panelOpen = signal(false);

  protected onValueChange(value: unknown): void {
    this.selectedValue.set(value);
  }

  protected onOpened(): void {
    this.panelOpen.set(true);
  }

  protected onClosed(): void {
    this.panelOpen.set(false);
  }

  /** Real `<ha-select>` markup reflecting the playground's current selections. */
  protected readonly generatedCode = computed(() => {
    const attrs = [`size="${this.selectedSize()}"`, 'placeholder="Elegí una fruta"'];
    if (this.withDisabled()) {
      attrs.push('[disabled]="true"');
    }
    if (this.withReadonly()) {
      attrs.push('[readonly]="true"');
    }
    return `<ha-select
  [options]="fruitOptions"
  ${attrs.join('\n  ')}
  (valueChange)="onValueChange($event)"
  (opened)="onOpened()"
  (closed)="onClosed()"
/>`;
  });

  protected onDisabledToggle(event: Event): void {
    this.withDisabled.set((event.target as HTMLInputElement).checked);
  }

  protected onReadonlyToggle(event: Event): void {
    this.withReadonly.set((event.target as HTMLInputElement).checked);
  }

  /**
   * Real `FormControl` used to demo the ONLY real semantic state this
   * component has: `HaSelect` exposes no `status` input — its
   * `.ha-select--error` class and `aria-invalid` are 100% automatic, computed
   * from `invalid && touched` on whatever control is bound here. Required and
   * untouched at first — abrí el panel y cerralo sin elegir nada para verlo.
   */
  protected readonly planControl = new FormControl<string | null>(null, {
    validators: [Validators.required],
  });

  /**
   * Separate control for the static "Estados reales" gallery below: touched
   * at construction time so its card renders the real error state without
   * requiring reader interaction, without entangling it with `planControl`.
   */
  protected readonly errorGalleryControl = new FormControl<string | null>(null, {
    validators: [Validators.required],
  });

  constructor() {
    this.errorGalleryControl.markAsTouched();
  }
}
