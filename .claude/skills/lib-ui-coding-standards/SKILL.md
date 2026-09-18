---
name: lib-ui-coding-standards
description:
  'Trigger: halo-ui component implementation, refactor, code review, PR
  checklist. Enforces component file structure, input/output conventions, signal
  usage, CSS variable patterns, and gga review criteria.'
license: MIT
metadata:
  author: JosepFernande
  version: '1.0'
  project: halo-ui
---

## Activation Contract

Load this skill when implementing, refactoring, or reviewing Angular components
in the `halo-ui` repository. This skill defines the concrete code patterns, file
organization, and review criteria that complement the architectural rules in
`lib-ui-architecture`.

## Component File Organization

```
libs/<lib>/src/lib/<component>/
├── <component>.component.ts    # Logic (signals, inputs, outputs, CDK usage)
├── <component>.component.html  # Template (native HTML, CDK directives)
├── <component>.component.css   # Styles (CSS variables only, :host scoping)
├── <component>.types.ts        # TypeScript interfaces, types
├── <component>.tokens.ts       # Component token definitions (--ha-<comp>-* )
├── <component>.constants.ts    # Constants, default values, variant maps (as needed)
└── <component>.utils.ts        # Pure helper functions, no side effects (as needed)

libs/<lib>/src/
└── index.ts                    # Barrel export for the whole lib (not per-component)
```

## Required Component Decorator

```typescript
@Component({
  selector: 'ha-<name>',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  // template and styles...
})
```

Selector convention: components with no native HTML equivalent use a custom
element selector (`ha-select`). Components that wrap a native form control use
an attribute selector on that element instead, so the native semantics/a11y are
preserved (`button[ha-button]`, `input[ha-input-text]`).

## Input/Output Patterns

Inputs use the signal-based `input()` API, not the `@Input()` decorator.

```typescript
// Size: exactly these three
readonly size = input<'sm' | 'md' | 'lg'>('md');

// Variant: exactly these three
readonly variant = input<'solid' | 'outline' | 'ghost'>('solid');

// Color: string (theme-registered), never enum
readonly color = input('primary');

// Boolean: no prefix, use booleanAttribute for attribute coercion
readonly disabled = input(false, { transform: booleanAttribute });

// Output: past tense, no 'on' prefix — @Output() + EventEmitter (not the
// output() function)
@Output() readonly closed = new EventEmitter<void>();
@Output() readonly valueChange = new EventEmitter<string>();
```

## Signal Usage Patterns

```typescript
// Local UI state
readonly isOpen = signal(false);
readonly loading = signal(false);

// Computed derived state
readonly buttonClasses = computed(() => [
  'ha-button',
  `ha-button--${this.size()}`,
  `ha-button--${this.variant()}`,
  `ha-button--${this.color()}`,
  this.disabled() ? 'ha-button--disabled' : '',
  this.loading() ? 'ha-button--loading' : '',
]);

// Effects for side effects (rare)
effect(() => {
  if (this.isOpen()) {
    this.focusTrap.focusInitialElement();
  }
});
```

## gga Review Criteria (What Gets Flagged)

When gga reviews a PR, it checks for violations of:

1. **Hardcoded values** in `.component.css` — any `#hex`, `rgb()`, `px`, `rem`,
   `em` for colors/spacing/radius. **YA CUBIERTO** por lint determinista
   (Stylelint): `halo-ui/no-hardcoded-colors` y
   `halo-ui/no-hardcoded-spacing-radius`.
2. **Missing `standalone: true`** on components, directives, pipes. **YA
   CUBIERTO** por `@angular-eslint/prefer-standalone` (ESLint).
3. **RxJS imports** (`BehaviorSubject`, `Subject`, `Observable`, `Subscription`,
   operators) used for local state. **PARCIALMENTE CUBIERTO** por
   `halo-ui/no-rxjs-local-state` (ESLint, nivel `warn`) para los imports
   directos de `BehaviorSubject`/`Subject`/`Observable`/`Subscription` desde
   `rxjs` en `*.component.ts`; el resto (uso de operadores, juicio sobre si un
   caso concreto es realmente estado local vs. un stream async legítimo) sigue
   requiriendo la revisión de gga (LLM).
4. **SCSS features** (`@mixin`, `@include`, `@function`, nesting beyond 1 level,
   `&:`)
5. **Custom overlay/focus/keyboard code** instead of CDK imports
6. **Color input as enum** instead of `string`. **YA CUBIERTO** por
   `halo-ui/no-color-literal-union` (ESLint).
7. **Component files > 400 lines**. **YA CUBIERTO** por
   `halo-ui/max-component-lines` (ESLint).
8. **Missing CDK imports** when overlay/a11y/focus/keyboard is needed
9. **Global CSS selectors** (`::ng-deep`, `:host-context`, element selectors
   outside `:host`). **YA CUBIERTO** por `halo-ui/no-ng-deep-host-context`
   (Stylelint).
10. **Utility class frameworks** (Tailwind classes, Bootstrap classes)

Reglas 1, 2, 6, 7 y 9 ya tienen chequeo determinista (ESLint/Stylelint) y no
dependen del juicio del LLM. La revisión de gga debe enfocarse en las reglas que
requieren juicio contextual real: 3 (parcialmente, ver
`halo-ui/no-rxjs-local-state` arriba), 5, 8 y 10.

### Formato de respuesta esperado

Upstream gga only enforces the `STATUS: PASSED` / `STATUS: FAILED` line; format
and language are otherwise left to the model, which is why raw PR comments used
to vary between bullets, prose, and tables, and defaulted to English. CI now
patches `lib/pr_mode.sh` at runtime (see the "Install gga" step in
`.github/workflows/ci.yml`) to force every response into a fixed Spanish,
table-based template — rule vs. evidence — regardless of PASSED/FAILED outcome.
This is tracked in GitHub issue #53.

The CI patch injects this instruction block into gga's prompt (the model never
echoes it back — it's the contract, not the output):

```
**FORMATO DE RESPUESTA OBLIGATORIO (en español, sin excepciones):**

Responde siempre en español neutro/profesional, sin importar el idioma de este prompt. Usa exactamente esta estructura, sin desviarte:
```

Resulting PR comment — PASSED example:

```
### 🤖 Gentleman Guardian Angel — Revisión de PR

**Resultado:** ✅ APROBADO

| Regla | Evidencia |
|-------|-----------|
| Sin valores hardcodeados en CSS | Se revisaron todos los `.component.css`; no hay `#hex`, `rgb()`, `px`, `rem` ni `em` para colores/espaciado/radios |
| `standalone: true` presente | El componente declara `standalone: true` en el decorador |

**✅ REVISIÓN DE CÓDIGO APROBADA**
```

Resulting PR comment — RECHAZADO example:

```
### 🤖 Gentleman Guardian Angel — Revisión de PR

**Resultado:** ❌ RECHAZADO

| Regla | Evidencia |
|-------|-----------|
| Sin valores hardcodeados en CSS | `button.component.css:12` usa `color: #3366ff` en lugar de una variable CSS del tema |

- Archivo: `button.component.css`
- Línea: 12
- Regla violada: Hardcoded values
- Descripción: color hardcodeado (`#3366ff`) en vez de una CSS custom property del tema

**❌ REVISIÓN DE CÓDIGO RECHAZADA**
```

## Exceptions (Require Explicit Justification)

If a rule cannot be satisfied, add a comment explaining why:

```typescript
// gga-ignore: CDK virtual scroll not yet stable for this use case
// TODO: Replace with CdkVirtualScrollViewport when @angular/cdk#12345 lands
```

These should be rare and temporary. gga will still flag them but the team can
approve with the justification.

## Review Checklist (For Human Reviewers)

### Architecture

- [ ] The 6 hard rules are respected (see `lib-ui-architecture` skill).
- [ ] **gga (Gentleman Guardian Angel) passes** — AI review of 6 hard rules +
      token system in CI.
- [ ] No new hardcoded colors, spacing, or radius in component CSS.
- [ ] No `::ng-deep`, no global selectors, no `!important` outside `:host`.
- [ ] `ViewEncapsulation.None`, `ChangeDetectionStrategy.OnPush`,
      `standalone: true` set.
- [ ] The component is under 400 lines.

### Theming

- [ ] Colors are bound to CSS custom properties on the host, not BEM modifiers.
- [ ] Custom colors (`treasury`, etc.) work without changes to the component.
- [ ] Hover/active/contrast states are derived automatically by the Theme
      Engine.

### Forms (CVA)

- [ ] Component implements `ControlValueAccessor`.
- [ ] `NgControl` is injected with `{ optional: true }`.
- [ ] Component works outside a form (no errors when used standalone).
- [ ] `onChange`, `onTouched`, `setDisabledState` are correctly called.
- [ ] `hasError` reflects `(invalid && touched)`.

### Accessibility

- [ ] All interactive elements are keyboard-reachable.
- [ ] Focus ring is visible (no `outline: none` without a replacement).
- [ ] ARIA attributes are correct (role, aria-\*, etc.).
- [ ] `jest-axe` test passes.
- [ ] Component works with screen readers (manual test with VoiceOver/NVDA).
- [ ] `prefers-reduced-motion` respected for animations.

### Testing

- [ ] Unit tests cover inputs, outputs, signals, state changes.
- [ ] A11y test with `jest-axe` exists.
- [ ] Showcase route added/updated with all variants and at least one custom
      color.
- [ ] Interaction tests for state changes (where applicable).
- [ ] Coverage thresholds met (80/80/90/80).

### Documentation

- [ ] Public API documented in TSDoc.
- [ ] `README.md` of the affected lib is updated (if user-facing change).
- [ ] Showcase route added/updated (if user-facing).

### Performance

- [ ] Component is under its budget (per `Performance Budgets`).
- [ ] No heavy dependencies added.
- [ ] Tree-shaking verified.

### CI

- [ ] All CI checks pass (lint, test, build, audit, gga-review).
- [ ] No `[skip ci]` in commit messages.
- [ ] Changeset is correct (packages, bump type, description).

## References

- Architecture skill: `lib-ui-architecture`
- Architecture & Foundation: `../../docs/architecture-and-foundation.md`
- Contribution / PR / Code Review Guidelines:
  `../../docs/contribution-pr-code-review-guidelines.md`
- Wiki — AI Code Review with gga (todavía no migrado a `docs/`):
  `https://github.com/JosepFernande/halo-ui/wiki/AI-Code-Review-with-gga`
- Repo: `https://github.com/JosepFernande/halo-ui`
