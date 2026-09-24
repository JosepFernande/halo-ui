# Showcase

`halo-ui` usa `apps/showcase` — una aplicación Angular real — como el entorno de
pruebas local para cada componente publicado. No hay una herramienta de preview
separada: la app showcase importa cada componente desde su subpath público
(`@halolib-ui/angular/button`, `@halolib-ui/angular/input-text`,
`@halolib-ui/angular/select`, ...) exactamente como lo haría un consumidor.

## Ejecutar el showcase localmente

```bash
# Start the dev server
npx nx serve showcase

# Build it
npx nx build showcase
```

## Registro del theme

El showcase registra el theme engine de halo-ui en el bootstrap
(`provideHaTheme()` en `apps/showcase/src/app/app.config.ts`), pasando una
config `semantic` que registra colores propios de la app (`success`, `error`,
`warning`, `info`, `neutral`) junto al `primary` por defecto de la librería —
esto es lo que alimenta los swatches de color en la página de Button.
`provideHaTheme()` escribe cada propiedad CSS custom de
Foundation/Semantic/Component (p. ej. `--ha-primary`, `--ha-button-bg`) inline
en `document.documentElement` — no se carga ninguna hoja de estilos Foundation
separada a través del array `styles` del target `build`/`serve`.

## Agregar una ruta de showcase para un componente nuevo

1. Crear un componente de página standalone bajo
   `apps/showcase/src/app/pages/<component>-page/`, importando el componente de
   la librería desde su punto de entrada público (`@halolib-ui/<lib>`).
2. Mostrar las variantes, tamaños, colores y estados principales del componente
   (no hace falta cubrir cada combinación) — esto es un entorno de pruebas
   funcional, no documentación exhaustiva.
3. Registrar la página en `apps/showcase/src/app/app.routes.ts`.
4. Agregar un enlace a la nueva ruta en el nav
   (`apps/showcase/src/app/app.component.html`).

## CI

La app showcase se buildea y lintea como parte de los pasos regulares
`npx nx run-many -t lint` / `-t build` del workflow `ci.yml`, junto con
cualquier otro proyecto — no existe un workflow dedicado para ella.
