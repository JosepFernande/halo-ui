---
name: github-issues-from-docs
description:
  'Trigger: crear issue, GitHub issue, US-XX, revisar issue, alinear issue con
  documentación. Crear y revisar issues de GitHub alineados con la documentación
  técnica de docs/, usando un índice de tags local para elegir qué archivos
  leer.'
license: Apache-2.0
metadata:
  author: jfernandezo
  version: '5.0'
---

## Activation Contract

Se ejecuta cuando el usuario:

- Quiere crear un nuevo issue de GitHub (US-XX, feature, bug)
- Quiere revisar, analizar o alinear un issue de GitHub existente contra la
  documentación técnica del proyecto (número de issue, URL)

**NO** se ejecuta para:

- Consultas generales sobre arquitectura (usa otras skills)
- Implementación directa de componentes (usa sdd-apply)

## Hard Rules

1. **`docs/` es la única fuente de verdad**: la documentación técnica de
   referencia (arquitectura, theming, CSS, testing, CI/CD, release,
   contribución, catálogo de componentes) vive en `docs/` dentro de este mismo
   checkout — ya está en el working tree, no hace falta clonar ni sincronizar
   nada por red. La wiki del proyecto es solo un espejo histórico (ver
   `README.md`, sección "Documentación"); esta skill nunca la lee.
2. **Toda la creación y actualización de issues ocurre vía `gh`**:
   `gh issue create` / `gh issue edit` / `gh issue comment`. Esta skill nunca
   escribe en `docs/`.
3. **Índice de tags estático**: `assets/document-index.json` mapea cada archivo
   de `docs/` a sus tags, para elegir 3-5 documentos relevantes por issue sin
   tener que leer los ~10 archivos completos en cada ejecución.
4. **Lectura directa, sin cache de contenido**: una vez elegidos los documentos
   relevantes, se leen con la tool `Read` directamente desde `docs/`. No hace
   falta cachear el contenido en ningún archivo intermedio — `docs/` ya está
   siempre en el HEAD del checkout, sin operaciones de git ni de red de por
   medio.
5. **Índice desactualizado, no bloqueante**: si `assets/document-index.json` no
   lista un archivo que sí existe en `docs/`, o le faltan tags obvios, seguir
   igual usando el índice tal cual está y avisarlo en el resumen final; no
   regenerarlo automáticamente a mitad de una revisión de issue. Regenerarlo es
   una acción explícita (`/reindex-docs`).

## Decision Gates

| Situación                                               | Acción                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `assets/document-index.json` no existe o no parsea      | Reportar el error y sugerir `/reindex-docs`; si igual hace falta seguir, fallback a `Glob('docs/*.md')` + leer todo |
| Issue menciona un concepto no cubierto por ningún tag   | Buscar coincidencia por nombre de archivo en `docs/` (fallback)                                                     |
| Usuario pide "revisar todo"                             | Auditoría completa: leer todos los archivos de `docs/`                                                              |
| Existe `.github/ISSUE_TEMPLATE`                         | Alinear el body generado con esa plantilla                                                                          |
| No existe `.github/ISSUE_TEMPLATE`                      | Usar formato Como/Quiero/Para + criterios de aceptación                                                             |
| `docs/` tiene un archivo nuevo que no está en el índice | Usarlo igual si el nombre matchea el tema (fallback por nombre) y sugerir `/reindex-docs` en el resumen             |

## Execution Steps

### Modo: Revisar issue existente

1. `gh issue view <number> --json title,body,labels,comments`
2. Determinar el tema del issue (keywords) y cargar `assets/document-index.json`
   (local, 0 operaciones de red o git)
3. Filtrar 3-5 archivos de `docs/` relevantes por match de tags (ver
   `assets/tagging-strategy.md`)
4. Leer esos archivos directamente con `Read` (`docs/<archivo>.md`) — siempre
   reflejan el HEAD actual del checkout, no requieren validación de frescura
5. Comparar el issue contra la documentación e identificar gaps
6. Proponer cambios al usuario
7. Si aprueba: `gh issue edit <number> --body ...` o
   `gh issue comment <number> --body ...`

### Modo: Crear nuevo issue

1. Recopilar requisitos del usuario
2. Cargar y leer los archivos de `docs/` relevantes (mismo flujo de arriba)
3. Generar el body del issue (ver Decision Gates para el formato)
4. `gh issue create --title "..." --body "..." --label "..."`
5. **Guardar learnings (opcional, best-effort)**: si el MCP de Engram está
   disponible, `mem_save` con
   `topic_key: "github-issue/{issue-number}/analysis"`. Si Engram no está
   disponible o falla, omitir este paso sin bloquear el flujo — el issue ya fue
   creado exitosamente en el paso 4.

### Comando `/reindex-docs`

Regenera `assets/document-index.json` escaneando `docs/*.md` y sus tags. Solo
hace falta correrlo cuando se agrega o renombra un archivo en `docs/`, o cuando
el contenido de uno existente cambia lo bastante como para que sus tags queden
desactualizados — no es parte del flujo normal de crear/revisar issues. Ver
`assets/initialization-script.md` para el detalle.

## Output Contract

Retornar:

- **Resumen de análisis**: gaps encontrados, archivos de `docs/` consultados
- **Resultado**: número y URL del issue de GitHub creado/actualizado
- **Aviso de índice desactualizado** (si aplica): archivos de `docs/` no
  cubiertos por `assets/document-index.json`
- **Confirmación de learnings guardados** en Engram (opcional, solo si Engram
  estaba disponible; su ausencia no afecta el resultado principal)

## References

- `assets/document-index.json` — índice estático de tags por archivo de `docs/`
- `assets/tagging-strategy.md` — estrategia de tagging y matching por keywords
- `assets/initialization-script.md` — script para generar/regenerar el índice
  (`/reindex-docs`)
- `assets/usage-examples.md` — ejemplos de flujo completo
- `references/docs-index-patterns.md` — forma del índice y patrones de
  lectura/filtrado
