# GitHub Issues from Docs Skill

Skill para crear y revisar issues de GitHub, alineados automáticamente con la
documentación técnica del proyecto en `docs/`, usando un índice de tags estático
para elegir qué archivos leer sin cargar todo `docs/` en cada ejecución.

`docs/` (en este mismo checkout) actúa como **fuente de documentación de solo
lectura** (arquitectura, theming, CSS, testing, release, etc.). La creación y
actualización de work items ocurre siempre en GitHub Issues vía `gh` CLI, para
integrarse de forma nativa con PRs.

> **Nota histórica:** esta skill usaba antes un cache híbrido sobre un clone del
> GitHub Wiki (`halo-ui.wiki.git`), porque la documentación de referencia vivía
> ahí. Desde que esa documentación se migró a `docs/` (ver
> [`README.md`](../../README.md) del repo, sección "Documentación"), toda esa
> maquinaria de clone/pull/HEAD-SHA dejó de tener sentido: `docs/` ya está en el
> working tree del agente, siempre en HEAD, sin operaciones de red. Ver
> `references/docs-index-patterns.md` para el detalle de qué reemplazó a qué.

## Características

- **Índice de tags estático**: `assets/document-index.json` mapea cada archivo
  de `docs/` a sus tags, para elegir 3-5 documentos relevantes por issue sin
  leer los ~10 archivos completos
- **Lectura directa, sin cache de contenido**: los archivos relevantes se leen
  con `Read` directamente desde `docs/`; siempre reflejan el HEAD actual, no
  hace falta ninguna validación de frescura
- **Cero operaciones de git o de red** para la revisión/creación de issues en sí
  (`gh` CLI aparte, que sí pega a la API de GitHub)
- **Tagging automático**: genera keywords por archivo para matching rápido con
  issues
- **Alineación automática**: detecta gaps entre issues de GitHub y documentación
- **`docs/` es solo lectura desde esta skill**: toda la escritura ocurre vía
  `gh issue create` / `gh issue edit` / `gh issue comment`

## Uso

### Revisar issue existente

```
revisar US-11
revisar issue #42
alinear issue #42 con documentación
```

**Flujo:**

1. Lee el issue desde GitHub:
   `gh issue view <number> --json title,body,labels,comments`
2. Determina temas relevantes (tokens, Theme Engine, colores, etc.)
3. Carga `assets/document-index.json` (local, 0 operaciones de red o git)
4. Filtra 3-5 archivos de `docs/` relevantes por match de tags
5. Lee esos archivos directamente con `Read`
6. Compara el issue contra la documentación e identifica gaps
7. Propone cambios y, si el usuario aprueba, actualiza el issue con
   `gh issue edit` / `gh issue comment`

### Crear nuevo issue

```
crear issue para componente Avatar
```

**Flujo:**

1. Recopila requisitos del usuario
2. Carga y lee los archivos de `docs/` relevantes
3. Genera el body del issue alineado con documentación (formato
   Como/Quiero/Para + criterios de aceptación, o la plantilla de
   `.github/ISSUE_TEMPLATE` si existe)
4. Crea el issue con `gh issue create --title ... --body ... --label ...`
5. Guarda learnings en Engram (opcional, best-effort: solo si el MCP está
   disponible; su ausencia no bloquea la creación del issue)

### Regenerar el índice de documentación

```
/reindex-docs
```

Solo hace falta cuando `docs/` gana un archivo nuevo o uno existente cambia de
tema lo bastante como para que sus tags queden desactualizados. No es parte del
flujo normal de crear/revisar issues.

## Cómo funciona

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuario: "revisar US-11" / "revisar issue #42"            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Leer issue desde GitHub (gh issue view)                   │
│    - Extraer: título, body, labels, comentarios              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Determinar tema: "Theme Engine, tokens, colores"          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Cargar assets/document-index.json (local, 0 ops git/red)  │
│    - Read(assets/document-index.json)                        │
│    - Obtener: 10 archivos con tags                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Filtrar archivos relevantes (local, 0 operaciones)         │
│    - Match keywords vs tags                                   │
│    - Seleccionar top 3-5 archivos                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Leer los archivos seleccionados                            │
│    - Read(docs/<archivo>.md) — siempre contenido actual       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Analizar issue                                              │
│    - Comparar contra documentación                             │
│    - Identificar gaps                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Actualizar en GitHub (si es necesario)                      │
│    - gh issue edit / gh issue comment con criterios             │
│      actualizados                                               │
└─────────────────────────────────────────────────────────────┘
```

## Estructura de archivos

```
skills/github-issues-from-docs/
├── SKILL.md                              # Skill principal
├── README.md                             # Este archivo
├── assets/
│   ├── document-index.json              # Índice de tags por archivo de docs/
│   ├── tagging-strategy.md              # Estrategia de tagging
│   ├── initialization-script.md         # Script de /reindex-docs
│   └── usage-examples.md                # Ejemplos de flujo completo
└── references/
    └── docs-index-patterns.md           # Forma del índice y patrones de lectura
```

`assets/document-index.json` se versiona con la skill (a diferencia del cache
anterior, que vivía en `.wiki-cache/`, gitignoreado): un cambio ahí se revisa en
el mismo PR que agrega o modifica el documento que lo motivó.

## Estructura del índice (`assets/document-index.json`)

```json
{
  "docs_dir": "docs",
  "documents": [
    {
      "page": "Architecture & Foundation",
      "file": "architecture-and-foundation.md",
      "tags": ["arquitectura", "tokens", "standalone", "signals"]
    }
  ]
}
```

`file` es relativo a `docs_dir`, así que el archivo real a leer es
`docs/architecture-and-foundation.md`.

### Análisis de issues (Engram, opcional / best-effort)

Es una anotación de memoria cross-session que solo se guarda si el MCP de Engram
está disponible. Si no lo está, se omite sin afectar la creación/actualización
del issue en GitHub.

```json
{
  "issue_number": 42,
  "title": "Theme Engine extensible basado en tokens",
  "analyzed_at": "2026-07-29T00:35:00.000Z",
  "documents_consulted": ["theming-deep-dive.md", "css-strategy.md"],
  "gaps_found": ["Falta algoritmo de derivación HSL"],
  "topic_key": "github-issue/42/analysis"
}
```

## Comandos

| Comando                              | Descripción                    |
| ------------------------------------ | ------------------------------ |
| `revisar US-XX` / `revisar issue #N` | Revisar issue existente        |
| `alinear issue #N con documentación` | Analizar issue por número      |
| `crear issue`                        | Crear nuevo issue de GitHub    |
| `/reindex-docs`                      | Regenerar el índice de `docs/` |

## Decisiones de diseño

### ¿Por qué GitHub Issues para los work items?

- Los issues de GitHub se integran de forma nativa con PRs, commits y CI/CD
- `gh` CLI permite crear/editar/comentar issues sin salir del flujo de
  desarrollo

### ¿Por qué la documentación de referencia vive en `docs/` y no en la wiki?

Nota histórica: esta documentación vivía antes en Notion, después se migró al
GitHub Wiki del repo (`halo-ui.wiki.git`) cuando Notion perdió su único rol
activo en el flujo de trabajo. Después se migró de nuevo, esta vez a `docs/`,
porque el Wiki no viaja con el repo (`.wiki-cache/` estaba gitignoreado) — un
colaborador o un agente de IA sin acceso a red perdía por completo ese contexto
al clonar. `docs/` sí viaja con cada clone y se revisa en el mismo PR que el
código que documenta. La wiki queda como espejo histórico; ver la sección
"Documentación" del `README.md` del repo.

### ¿Por qué un índice de tags y no leer siempre los ~10 archivos completos?

- Un issue típicamente se relaciona con 3-5 archivos, no con los ~10
- Leer solo los relevantes ahorra tokens sin sacrificar frescura: como `docs/`
  es local, no hay tradeoff entre "cache" y "datos frescos" — leer siempre
  devuelve el contenido actual, elegir cuáles leer es lo único que el índice
  resuelve

### ¿Por qué tags y no búsqueda full-text?

- Tags permiten matching semántico rápido
- Con ~10 archivos, comparar contra un diccionario de tags conocidos es más
  simple y predecible que implementar búsqueda full-text

## Limitaciones

- **Tags no perfectos**: matching basado en keywords puede tener falsos
  positivos/negativos
- **Mantenimiento manual del índice**: si `docs/` cambia de contenido sin correr
  `/reindex-docs`, los tags pueden quedar desactualizados (el contenido leído
  nunca lo está, solo la elección de qué leer puede ser subóptima)
- **No cubre documentación que solo existe en la wiki todavía**: algunas páginas
  históricas (versionado, Nx workspace setup, guías de Storybook ya removidas,
  etc.) no tienen equivalente en `docs/` todavía; esta skill no las lee hasta
  que se migren

## Mantenimiento

### Ejecutar después de cambios en `docs/`

```
/reindex-docs
```

No hace falta ejecutarlo por rutina — a diferencia del mecanismo anterior, no
hay nada que se desactualice solo con el paso del tiempo.

## Métricas

### Estadísticas de la skill

La skill reporta al final de cada sesión:

- Archivos de `docs/` consultados
- Gaps encontrados
- Si el índice está desactualizado respecto a `docs/` (archivos sin tags)

### Ejemplo

```
Sesión: Revisar issue #11 (US-11)
- Archivos consultados: 3 (theming-deep-dive.md, css-strategy.md, architecture-and-foundation.md)
- Gaps encontrados: 3
- Resultado: gh issue edit #11 actualizado
```

## Troubleshooting

### "Índice no encontrado o corrupto"

**Solución:** Ejecutar `/reindex-docs` para regenerar
`assets/document-index.json` desde `docs/*.md`.

### "Un archivo de docs/ no aparece en ningún resultado"

**Solución:** Correr `/reindex-docs` — el archivo probablemente se agregó
después de la última regeneración del índice.

### "Tags no relevantes"

**Solución:** Los tags se generan automáticamente. Si el matching es pobre,
revisar `assets/tagging-strategy.md` y ajustar el diccionario de keywords, y
correr `/reindex-docs`.

## Futuras mejoras

- [ ] Tags generados por LLM (más precisos)
- [ ] Migrar el resto de las páginas de la wiki (versionado, Nx workspace, etc.)
      a `docs/` y sumarlas al índice
- [ ] Integración con SDD (Spec-Driven Development)

## Licencia

Apache-2.0

## Autor

jfernandezo

## Versión

5.0
