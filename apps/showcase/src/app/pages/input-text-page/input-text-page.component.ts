import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HaInputText } from '@halolib-ui/angular/input-text';
import type { HaInputTextSize } from '@halolib-ui/angular/input-text';
import { HaBreadcrumb } from '@halolib-ui/angular/breadcrumb';
import type { HaBreadcrumbItem } from '@halolib-ui/angular/breadcrumb';
import { CodeBlockComponent } from '../../shared/code-block/code-block.component';

/** One row of the real `HaInputText` Inputs API reference table. */
interface ApiInput {
  readonly name: string;
  readonly type: string;
  readonly default: string;
  readonly description: string;
}

/**
 * Showcase playground for `input[ha-input-text]` (`libs/input-text`): sizes,
 * disabled/readonly states, and the real error state driven by Angular Forms
 * (`invalid && touched` on a bound `FormControl`) — not a fictional `status` input.
 */
@Component({
  selector: 'app-input-text-page',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, HaInputText, HaBreadcrumb, CodeBlockComponent],
  templateUrl: './input-text-page.component.html',
  styleUrl: './input-text-page.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputTextPageComponent {
  protected readonly breadcrumbItems: HaBreadcrumbItem[] = [
    { label: 'Documentación', link: '/instalacion' },
    { label: 'Componentes', link: '/componentes/boton' },
    { label: 'InputText' },
  ];

  protected readonly sizes: readonly HaInputTextSize[] = ['sm', 'md', 'lg'];

  /** The real 6-input `HaInputText` API surface — no more, no less. */
  protected readonly apiInputs: readonly ApiInput[] = [
    { name: 'size', type: `'sm' | 'md' | 'lg'`, default: `'md'`, description: 'Tamaño del input.' },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      description:
        'Deshabilita el input. También se activa solo si el `FormControl` asociado está disabled.',
    },
    {
      name: 'readonly',
      type: 'boolean',
      default: 'false',
      description: 'Aplica el atributo `readonly` nativo.',
    },
    {
      name: 'placeholder',
      type: 'string',
      default: `''`,
      description: 'Placeholder nativo, mostrado con el input vacío.',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: `''`,
      description: 'Valor del atributo `aria-label`.',
    },
    {
      name: 'ariaDescribedBy',
      type: 'string',
      default: `''`,
      description:
        'Ids separados por coma para `aria-describedby` (p. ej. tu propio hint o mensaje de error).',
    },
  ];

  // --- Interactive Playground state (Section 1) ---

  protected readonly selectedSize = signal<HaInputTextSize>('md');
  protected readonly withDisabled = signal(false);
  protected readonly withReadonly = signal(false);
  protected readonly activeTab = signal<'preview' | 'code'>('preview');

  /** Real `<input ha-input-text>` markup reflecting the playground's current selections. */
  protected readonly generatedCode = computed(() => {
    const attrs = [`size="${this.selectedSize()}"`, 'placeholder="Escribí algo"'];
    if (this.withDisabled()) {
      attrs.push('[disabled]="true"');
    }
    if (this.withReadonly()) {
      attrs.push('[readonly]="true"');
    }
    return `<input ha-input-text ${attrs.join(' ')} />`;
  });

  protected onDisabledToggle(event: Event): void {
    this.withDisabled.set((event.target as HTMLInputElement).checked);
  }

  protected onReadonlyToggle(event: Event): void {
    this.withReadonly.set((event.target as HTMLInputElement).checked);
  }

  /**
   * Real `FormControl` used to demo the ONLY real semantic state this
   * component has: `HaInputText` exposes no `status`/`errorMessage` input —
   * its `.ha-input-text--error` class and `aria-invalid` are 100% automatic,
   * computed from `invalid && touched` on whatever control is bound here.
   * Type something invalid and blur the field to see it for real.
   */
  protected readonly emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  /**
   * Separate control for the static "Estados reales" gallery below: touched
   * at construction time so its card renders the real error state without
   * requiring reader interaction, without entangling it with `emailControl`.
   */
  protected readonly errorGalleryControl = new FormControl('not-an-email', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  constructor() {
    this.errorGalleryControl.markAsTouched();
  }
}
