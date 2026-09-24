# Guías de Contribución / PR / Revisión de Código

## Propósito

Define el checklist de revisión de código, la Definition of Done y las labels
del repo para `halo-ui`. Para el flujo de contribución del día a día — setup de
branches, convenciones de commits, el flujo de changesets y la mecánica de
release — ver [`CONTRIBUTING.md`](../CONTRIBUTING.md) en la raíz del repo, que
ya cubre ese terreno con precisión; este documento no lo repite. Combinar con
[CI/CD Pipeline](./ci-cd-pipeline.md) (los checks del PR) y
[Testing Strategy](./testing-strategy.md) (requisitos de tests).

## Plantilla de Descripción de PR

`.github/PULL_REQUEST_TEMPLATE.md` existe y GitHub la autocompleta al abrir un
PR nuevo (según `CONTRIBUTING.md`, los títulos/descripciones de PR se escriben
en español en este repo, por eso la plantilla está en español):

```markdown
## Resumen

<!-- Qué cambia y por qué, en bullets -->

-

## Plan de prueba

<!-- Cómo se verificó: tests agregados/actualizados, build, revisión manual -->

- [ ]

## Changeset

- [ ] Este PR modifica un paquete publicable (`@halolib-ui/core`,
      `@halolib-ui/button`, `@halolib-ui/input-text`, `@halolib-ui/angular`) y
      agrega un changeset (`npx changeset`)
- [ ] No aplica — no toca ningún paquete publicable
```

## Checklist de Revisión

Un revisor debe verificar:

### Arquitectura

- [ ] Se respetan las 6 reglas duras (ver la skill `lib-ui-architecture`).
- [ ] **gga (Gentleman Guardian Angel) pasa** — revisión con IA de las 6 reglas
      duras + sistema de tokens en CI.
- [ ] No hay colores, espaciados ni radios hardcodeados nuevos en el CSS del
      componente.
- [ ] No hay `::ng-deep`, ni selectores globales, ni `!important` fuera de
      `:host`.
- [ ] Están seteados `ViewEncapsulation.None`, `ChangeDetectionStrategy.OnPush`,
      `standalone: true`.
- [ ] El componente tiene menos de 400 líneas.

### Theming

- [ ] Los colores están vinculados a propiedades CSS custom en el host, no a
      modificadores BEM.
- [ ] Los colores personalizados (`treasury`, etc.) funcionan sin cambios en el
      componente.
- [ ] Los estados hover/active/contraste se derivan automáticamente por el Theme
      Engine.

### Formularios (CVA)

- [ ] El componente implementa `ControlValueAccessor`.
- [ ] `NgControl` se resuelve de forma perezosa (getter sobre `Injector`,
      `{ self: true, optional: true }`), nunca como inicializador de campo.
- [ ] El componente funciona fuera de un formulario (sin errores standalone).
- [ ] `onChange`, `onTouched`, `setDisabledState` se llaman correctamente.
- [ ] `hasError` refleja `(invalid && touched)`.

### Accesibilidad

- [ ] Cada elemento interactivo es navegable por teclado.
- [ ] El anillo de foco es visible (sin `outline: none` sin un reemplazo).
- [ ] Los atributos ARIA son correctos (role, `aria-*`, etc.).
- [ ] El test de `jest-axe` pasa.
- [ ] El componente funciona con lectores de pantalla (test manual con
      VoiceOver/NVDA).
- [ ] Se respeta `prefers-reduced-motion` para las animaciones.

### Testing

- [ ] Los tests unitarios cubren inputs, outputs, signals, cambios de estado.
- [ ] Existe un test de a11y con `jest-axe`.
- [ ] Existe una ruta de showcase con cada variante y al menos un color
      personalizado.
- [ ] Existen tests de interacción para los cambios de estado (donde aplique).
- [ ] Se cumplen los umbrales de cobertura (80/80/90/80).

### Documentación

- [ ] La API pública está documentada en TSDoc.
- [ ] El `README.md` de la lib afectada está actualizado (si es user-facing).
- [ ] La ruta de showcase está agregada/actualizada (si es user-facing).

### Performance

- [ ] El componente está dentro de su presupuesto de tamaño.
- [ ] No se agregaron dependencias pesadas.
- [ ] El tree-shaking está verificado.

### CI

- [ ] Todos los checks de CI pasan (`lint`, `stylelint`, `test`, `build`,
      `audit`). `gga-review` figura como check requerido en la protección de
      branch, pero su job usa `continue-on-error: true` — en la práctica nunca
      bloquea el merge, así que un revisor humano igual debe leer su output.
- [ ] No hay `[skip ci]` en los mensajes de commit.
- [ ] El changeset es correcto (paquetes, tipo de bump, descripción).

## Definition of Done

Un PR está "done" cuando:

1. Todos los checks de CI pasan.
2. Hay al menos una aprobación (una vez que el equipo crezca más allá de una
   persona).
3. Cada ítem del checklist de revisión está marcado.
4. El branch está actualizado con `main`.
5. Los conflictos están resueltos.
6. El PR se mergea a `main`. El repo tiene squash, merge commit y rebase
   habilitados todos (verificado vía la configuración de merge del repo) — no se
   impone una estrategia única, la historia real mezcla las tres.

Después del merge, `release.yml` toma los changesets pendientes y publica nuevas
versiones si las hay — ver
[Release and Publishing](./release-and-publishing.md).

## Labels

Verificado vía `gh label list` — estas son las labels que realmente existen en
el repo:

| Label                  | Propósito                              |
| ---------------------- | -------------------------------------- |
| `type:feature`         | Feature nueva o pedido                 |
| `type:bug`             | Corrección de bug                      |
| `type:chore`           | Mantenimiento, tooling, CI, refactors  |
| `type:docs`            | Solo documentación                     |
| `type:breaking-change` | Cambio disruptivo (breaking change)    |
| `type:refactor`        | Refactor de código                     |
| `status:approved`      | Issue aprobada para implementación     |
| `bug`                  | Algo no está funcionando               |
| `documentation`        | Mejoras o agregados a la documentación |
| `enhancement`          | Feature nueva o pedido                 |
| `duplicate`            | Esta issue o pull request ya existe    |
| `good first issue`     | Buena para nuevos colaboradores        |
| `help wanted`          | Se necesita atención extra             |
| `invalid`              | Esto no parece correcto                |
| `question`             | Se pide más información                |
| `wontfix`              | Esto no se va a resolver               |

`area:*`, `needs-changeset`, `needs-tests`, `needs-a11y`, `wip` y `do-not-merge`
**no** existen en el repo — una versión anterior de esta página las documentaba;
se quitaron acá para reflejar la realidad.

## Etiqueta

- **Sé amable.** Los revisores también son contribuyentes. Critica el código, no
  a la persona.
- **Sé específico.** "Esto podría estar mejor" no es accionable. "Mové la
  llamada a `onChange` después de `value.set()` para evitar una race condition"
  sí lo es.
- **Sé receptivo.** Apuntá a revisar los PR dentro de 24 horas. Comentá temprano
  si no podés.
- **Sé honesto.** Preguntá si algo no tiene sentido. Decilo, con justificación,
  si algo parece incorrecto.
- **Discrepá y comprometete.** Si autor y revisor no logran acordar después de 2
  rondas, escalar (por ahora, el maintainer decide).

## Responsabilidades del Maintainer

Si sos el maintainer:

- Triagear issues dentro de 48 horas.
- Revisar PRs dentro de 24 horas.
- Cortar un release cada 2 semanas (o según se necesite).
- Actualizar los docs de arquitectura cuando la arquitectura cambie.
- Comunicar los breaking changes con claridad (en PRs, release notes y docs).

## Reglas del Equipo

- Todo PR DEBE pasar todos los checks de CI antes del merge.
- Todo PR user-facing DEBE incluir un changeset.
- Todo PR de componente DEBE agregar/actualizar tests, stories y el showcase.
- Toda descripción de PR DEBE seguir la plantilla.
- Toda revisión DEBE usar el checklist (o explicar por qué un ítem no aplica).
- Los breaking changes DEBEN marcarse en el título del PR con `!` y en el footer
  del changeset.
- No self-merge sin una segunda mirada (incluso un maintainer solo debería
  esperar 24 horas por feedback cuando sea posible).

## Referencia

- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — nomenclatura de branches,
  convenciones de commits, el flujo de changesets, comandos de inicio rápido
- skill `lib-ui-coding-standards` (`skills/lib-ui-coding-standards/SKILL.md`) —
  estructura de archivos, convenciones de input/output, criterios de revisión de
  gga
- [CI/CD Pipeline](./ci-cd-pipeline.md) — los checks referenciados arriba
