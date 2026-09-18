# Ejemplos de Uso

## Ejemplo 1: Revisar issue existente

### Input del usuario

```
revisar US-11
```

### Flujo de ejecución

```
[Skill] Iniciando revisión de US-11 (issue #11)...

[1/6] Leyendo issue desde GitHub...
  → gh issue view 11 --json title,body,labels,comments
  → Título: "Theme Engine extensible basado en tokens"
  → Criterios: 11 criterios encontrados en el body

[2/6] Determinando tema del issue...
  → Keywords extraídas: "Theme Engine", "provideHaTheme", "colores", "tokens"
  → Tema: Theming, tokens, colores personalizados

[3/6] Cargando assets/document-index.json...
  → Read(skills/github-issues-from-docs/assets/document-index.json)
  → Índice encontrado: 10 archivos de docs/

[4/6] Filtrando archivos relevantes...
  → Match de keywords vs tags:
    - "theming-deep-dive.md" → score: 0.8 (tags: theme-engine, provideHaTheme, colores)
    - "css-strategy.md" → score: 0.5 (tags: tokens, theme-engine)
    - "architecture-and-foundation.md" → score: 0.4 (tags: tokens, arquitectura)
  → Archivos seleccionados: 3

[5/6] Leyendo los archivos seleccionados...
  → Read(docs/theming-deep-dive.md)
  → Read(docs/css-strategy.md)
  → Read(docs/architecture-and-foundation.md)
  → (siempre contenido actual del working tree, sin chequeo de frescura)

[6/6] Analizando issue contra documentación...
  → Comparando criterios del issue #11 vs documentación:
    ✓ Theme Engine centralizado en core/theme
    ✓ provideHaTheme() expuesto
    ✓ Default theme funcional
    ✗ Falta: algoritmo de derivación HSL (hover +8%, active -8%, contrast WCAG)
    ✗ Falta: ThemeService runtime API (applyTheme, overrideColor, reset)
    ✗ Falta: normalización de nombres de colores ([a-z0-9-])
  → Gaps encontrados: 3

  → gh issue edit 11 --body "<body actualizado con criterios agregados>"
  → Actualización exitosa

[Resumen]
  ✓ Issue #11 (US-11) revisado y actualizado en GitHub
  ✓ Archivos de docs/ consultados: 3
  ✓ Gaps encontrados: 3
  ✓ Criterios agregados: 3
```

## Ejemplo 2: Revisar issue con un concepto no cubierto por ningún tag

### Input del usuario

```
revisar issue #8
```

### Flujo de ejecución

```
[Skill] Iniciando revisión del issue #8...

[1/6] Leyendo issue desde GitHub...
  → gh issue view 8 --json title,body,labels,comments
  → Título: "Configurar ESLint y Prettier para DX consistente"

[2/6] Determinando tema...
  → Keywords: "ESLint", "Prettier", "Stylelint", "custom rules"

[3/6] Cargando assets/document-index.json...
  → Índice encontrado: 10 archivos

[4/6] Filtrando archivos relevantes...
  → Archivos seleccionados: 2
    - "css-strategy.md" (tags: stylelint, eslint)
    - "contribution-pr-code-review-guidelines.md" (tags: code-review)
  → "Prettier" no matchea ningún tag conocido → fallback: buscar el nombre en
    los archivos de docs/ (ninguno lo menciona en el título) → se sigue solo
    con los 2 archivos matcheados por tag

[5/6] Leyendo los archivos seleccionados...
  → Read(docs/css-strategy.md)
  → Read(docs/contribution-pr-code-review-guidelines.md)

[6/6] Analizando issue...
  → Gaps encontrados:
    ✗ Falta mencionar Stylelint con custom rules
    ✗ Falta ESLint custom rules (ViewEncapsulation.None, color string, 400 líneas)

  → gh issue edit 8 --body "<body actualizado>"
  → Actualización exitosa

[Resumen]
  ✓ Issue #8 revisado y actualizado en GitHub
  ✓ Archivos de docs/ consultados: 2
  ✓ Gaps encontrados: 2
```

## Ejemplo 3: Crear nuevo issue

### Input del usuario

```
crear issue para componente Avatar
```

### Flujo de ejecución

```
[Skill] Iniciando creación de issue para Avatar...

[1/4] Recopilando requisitos...
  → Usuario: "componente Avatar con imagen, iniciales, tamaños y colores dinámicos"

[2/4] Cargando archivos relevantes...
  → Keywords: "Avatar", "componente", "imagen", "tamaños", "colores"
  → Archivos seleccionados: 3
    - "architecture-and-foundation.md" (componentes, tokens, naming-convention)
    - "css-strategy.md" (BEM, ViewEncapsulation, tokens)
    - "theming-deep-dive.md" (colores dinámicos)
  → Read() directo de los 3 (sin chequeo de frescura, sin cache)

[3/4] Generando body del issue alineado con documentación...
  → Analizando patrones de issues previos (Button, Input, Select)
  → Generando criterios basados en arquitectura:
    - Input color (string, abierto — Theme Engine)
    - Input size (sm | md | lg)
    - Input src (URL de imagen)
    - Input initials (fallback cuando no hay imagen)
    - ViewEncapsulation.None
    - Clases CSS con prefijo ha- (BEM)
    - Solo tokens CSS
    - Compatible con provideHaTheme()
    - Signals + OnPush
    - Tipado sin any
    - Archivo bajo 400 líneas

[4/4] Creando issue en GitHub...
  → gh issue create --title "Crear componente Avatar" --label "component,enhancement" --body "..."
  → Como: "developer que usa la librería"
  → Quiero: "un componente Avatar con soporte para imagen, iniciales, tamaños y colores dinámicos vía Theme Engine"
  → Para: "mostrar avatares de usuarios de forma consistente sin CSS custom"
  → Criterios: 11 criterios
  → Creación exitosa: issue #15

  → Guardando learnings (opcional, best-effort): si Engram está disponible,
    mem_save con topic_key "github-issue/15/analysis"; si no, se omite sin
    bloquear (el issue ya se creó en el paso anterior)

[Resumen]
  ✓ Issue #15 creado exitosamente en GitHub
  ✓ Alineado con: architecture-and-foundation.md, css-strategy.md, theming-deep-dive.md
  ✓ Archivos de docs/ consultados: 3
  ✓ Criterios generados: 11
```

## Ejemplo 4: Índice desactualizado (archivo nuevo en `docs/`)

### Input del usuario

```
revisar issue #20
```

### Flujo de ejecución

```
[Skill] Iniciando revisión del issue #20...

[1/6] Leyendo issue desde GitHub...
  → Título: "Agregar componente Tooltip con soporte de posicionamiento"

[2/6] Determinando tema...
  → Keywords: "Tooltip", "posicionamiento", "overlay"

[3/6] Cargando assets/document-index.json...
  → Índice encontrado: 10 archivos (no incluye "overlay-positioning.md",
    agregado a docs/ recientemente)

[4/6] Filtrando archivos relevantes...
  → Ningún tag matchea "tooltip" ni "posicionamiento" directamente
  → Fallback: comparar keywords contra nombres de archivo en docs/ (Glob) →
    "overlay-positioning.md" matchea por nombre aunque no esté en el índice

[5/6] Leyendo el archivo encontrado por fallback...
  → Read(docs/overlay-positioning.md)

[6/6] Analizando issue...
  → Gaps encontrados: 2

  → gh issue edit 20 --body "<body actualizado>"

[Resumen]
  ✓ Issue #20 revisado y actualizado en GitHub
  ✓ Archivos de docs/ consultados: 1 (vía fallback, no estaba en el índice)
  ⚠ assets/document-index.json no lista docs/overlay-positioning.md — correr
    /reindex-docs para agregarlo con sus tags
  ✓ Gaps encontrados: 2
```

## Ejemplo 5: Comando de reindexado

### Input del usuario

```
/reindex-docs
```

### Flujo de ejecución

```
[Skill] Iniciando /reindex-docs...

[1/3] Listando archivos en docs/...
  → Glob('docs/*.md') → 10 archivos encontrados

[2/3] Leyendo cada archivo y generando tags...
  → [1/10] architecture-and-foundation.md... 8 tags
  → [2/10] ci-cd-pipeline.md... 9 tags
  → ... (8 archivos más) ...
  → [10/10] components.md... 8 tags

[3/3] Escribiendo el índice...
  → Write(skills/github-issues-from-docs/assets/document-index.json)

[Resumen]
  ✓ Índice regenerado: 10 archivos, 84 tags totales
  ✓ Sin operaciones de git ni de red — solo lecturas locales de docs/
```
