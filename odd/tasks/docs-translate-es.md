# Tarea: Traducir docs/ al español (+ diagramas Mermaid donde ayuden)

**Issue**: [#177](https://github.com/JosepFernande/halo-ui/issues/177)
**Branch**: `docs/translate-docs-es` (worktree `pa-ui-worktrees/docs-translate-es`, base `main`)
**Modo**: Organic Driven Development (implementación autorizada explícitamente por el usuario)

## Objetivo

Traducir los 11 archivos de `docs/` al español neutro/profesional, preservando
estructura, anclas, bloques de código y comandos. De paso, agregar un diagrama
Mermaid en las secciones donde una traducción 1:1 de prosa deje un flujo,
pipeline o jerarquía de capas difícil de seguir (arquitectura, CI/CD, ciclo de
vida CVA, capas de theming, release).

## Problema / Por qué

Ver issue #177: toda la documentación técnica está en inglés, lo que dificulta
la consulta diaria del equipo (mayormente hispanohablante). El usuario pidió
además mejorar con Mermaid donde se pueda, no solo traducir.

## Alcance autorizado

- Traducir el texto/prosa de los 11 archivos listados abajo.
- Preservar: nombres de archivo, rutas, identificadores, comandos, bloques de
  código, sintaxis Mermaid existente (solo se traducen las etiquetas visibles).
- Agregar diagramas Mermaid nuevos SOLO donde clarifiquen un flujo/jerarquía
  existente en prosa — no agregar diagramas por agregar.
- No agregar traducción a `README.md` ni a otros archivos fuera de `docs/`
  (fuera de alcance de la issue).

## Restricciones

- Formato final debe pasar `npx nx format:write` (Prettier: `proseWrap:
  always`, `printWidth: 80` para `.md`).
- Un commit por task (work-unit commit), Conventional Commit en español
  (`docs(<scope>): ...`), branch `docs/translate-docs-es`.
- TDD: no aplica (cambio de contenido de documentación, sin código
  ejecutable). Verificación = readback estructural (headings, anclas, enlaces
  cruzados, bloques de código intactos) + `format:check`.
- Delivery: estrategia de PR (1 PR vs. PRs encadenados por archivo) se decide
  recién al momento de pushear/abrir PR — forecast total (~2838 líneas
  originales) supera el heurístico de ~400 líneas/task, así que se trabaja
  en commits chicos por archivo para dejar la puerta abierta a ambas
  opciones.

## Checklist

- [ ] **T1** — `docs/components.md` (27L) + `docs/showcase.md` (46L):
      traducir ambos (agrupados por tamaño chico). Sin diagrama nuevo
      previsto (son índices/listas cortas).
- [ ] **T2** — `docs/contribution-pr-code-review-guidelines.md` (194L):
      traducir. Evaluar diagrama de flujo PR (draft → review → merge) si el
      doc lo describe en prosa.
- [ ] **T3** — `docs/control-value-accessor-cva.md` (243L): traducir.
      Evaluar diagrama de ciclo de vida CVA (writeValue/registerOnChange/
      registerOnTouched/setDisabledState).
- [ ] **T4** — `docs/workflow-ci-jobs-visual-guide.md` (262L): traducir
      (ya tiene diagramas Mermaid — traducir solo las etiquetas de texto,
      no la sintaxis).
- [ ] **T5** — `docs/testing-strategy.md` (271L): traducir. Evaluar
      diagrama de pirámide/capas de testing si aplica.
- [ ] **T6** — `docs/css-strategy.md` (284L): traducir. Evaluar diagrama
      de capas de tokens CSS (si el doc describe una jerarquía).
- [ ] **T7** — `docs/release-and-publishing.md` (344L): traducir. Evaluar
      diagrama de pipeline de release (changeset → version → publish →
      deploy).
- [ ] **T8** — `docs/architecture-and-foundation.md` (363L): traducir.
      Evaluar diagrama de arquitectura general (Nx workspace, libs/apps).
- [ ] **T9** — `docs/theming-deep-dive.md` (393L): traducir. Evaluar
      diagrama de capas de theming (tokens → temas → componentes).
- [ ] **T10** — `docs/ci-cd-pipeline.md` (411L): traducir. Evaluar diagrama
      de pipeline CI/CD (puede reusar/alinear con el de T4 si hay solape).
- [ ] **T11** — Revisión final: `npx nx format:write`, verificar enlaces
      cruzados entre docs traducidos, actualizar referencias desde
      `README.md`/skills si el texto citado cambió.

## Criterios de aceptación

- Los 11 archivos están en español, sin dejar prosa a medio traducir.
- Ningún bloque de código, comando, ruta o nombre de archivo fue traducido.
- Los anchors de headings usados por enlaces internos siguen resolviendo
  (revisar `[texto](archivo.md#anchor)` entre docs).
- `npx nx format:check` pasa sobre `docs/**/*.md`.
- Cada diagrama Mermoid agregado compila (sintaxis válida) y su texto está
  en español.

## Progreso

_(se actualiza tarea por tarea, con hash de commit como evidencia)_
