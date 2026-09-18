# @halolib-ui/angular

[![npm version](https://img.shields.io/npm/v/@halolib-ui/angular)](https://www.npmjs.com/package/@halolib-ui/angular)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular)](https://angular.dev/)

**[Live Showcase ↗](https://josepfernande.github.io/halo-ui/)** — Interactive
component playground with live examples

---

Accessible, token-driven Angular 19 UI component library. Built with a single
theme engine that powers every component through CSS custom properties — no
runtime theme switching overhead, full dark mode support, and complete
customization through design tokens.

## Features

- **Token-driven theming** — Every visual property flows from a single set of
  CSS custom properties. Change one token, update the entire UI.
- **Accessible by default** — Built on Angular CDK primitives with proper ARIA
  attributes, keyboard navigation, and screen reader support.
- **Tree-shakeable** — Secondary entry points ensure you only ship what you use.
- **Angular 19+** — Built with signals, standalone components, and the latest
  Angular APIs.
- **Zero runtime cost** — Theme engine compiles to pure CSS; no JavaScript theme
  switching at runtime.

## Installation

```bash
npm install @halolib-ui/angular
```

## Quick Start

### 1. Register the theme engine

```ts
// app.config.ts
import { provideHaTheme } from '@halolib-ui/angular/core';

export const appConfig = {
  providers: [provideHaTheme()],
};
```

### 2. Import components

```ts
import { HaButton } from '@halolib-ui/angular/button';
import { HaInputText } from '@halolib-ui/angular/input-text';
import { HaSelect } from '@halolib-ui/angular/select';
import { HaIcon } from '@halolib-ui/angular/icon';
import { HaBreadcrumb } from '@halolib-ui/angular/breadcrumb';
```

The root barrel (`@halolib-ui/angular`, no subpath) re-exports every symbol from
all entry points for consumers who prefer a single import.

## Entry Points

| Import                           | Contents                                        |
| -------------------------------- | ----------------------------------------------- |
| `@halolib-ui/angular`            | Root barrel — re-exports all entry points below |
| `@halolib-ui/angular/core`       | Theme engine, theme tokens, foundation scales   |
| `@halolib-ui/angular/button`     | `HaButton` component and its tokens             |
| `@halolib-ui/angular/input-text` | `HaInputText` component and its tokens          |
| `@halolib-ui/angular/select`     | `HaSelect` component and its tokens             |
| `@halolib-ui/angular/icon`       | `HaIcon` component (Lucide integration)         |
| `@halolib-ui/angular/breadcrumb` | `HaBreadcrumb` component and its tokens         |

## Theming

The theme engine is built on CSS custom properties with three layers:

1. **Foundation tokens** — Colors, spacing, typography scales
2. **Semantic tokens** — `--ha-color-primary`, `--ha-color-surface`, etc.
3. **Component tokens** — `--ha-button-bg`, `--ha-input-border`, etc.

Override any token at the `:root` level or scope it to specific sections:

```css
:root {
  --ha-color-primary: #0066cc;
  --ha-color-surface: #ffffff;
  --ha-color-on-surface: #1a1a1a;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --ha-color-surface: #1a1a1a;
    --ha-color-on-surface: #ffffff;
  }
}
```

See the
[theming deep-dive](https://github.com/JosepFernande/halo-ui/blob/main/docs/theming-deep-dive.md)
for the full token architecture.

## Peer Dependencies

```json
{
  "@angular/common": "^19.2.0",
  "@angular/core": "^19.2.0",
  "@angular/cdk": "^19.2.0",
  "@angular/forms": "^19.2.0"
}
```

## Links

- **[Showcase](https://josepfernande.github.io/halo-ui/)** — Interactive
  component playground
- **[GitHub](https://github.com/JosepFernande/halo-ui)** — Source code and
  issues
- **[Documentation](https://github.com/JosepFernande/halo-ui/tree/main/docs)** —
  Architecture, theming, testing, and contributing guides

## License

MIT © JosepFernande
