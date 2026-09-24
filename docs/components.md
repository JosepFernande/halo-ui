# Componentes

Catálogo de componentes de `halo-ui`. `@halolib-ui/angular` es el único paquete
npm publicado (proyecto Nx `halo-ui`); cada fila de abajo es uno de sus puntos
de entrada secundarios de ng-packagr, no un paquete separado. Cada fila enlaza a
la carpeta del punto de entrada bajo `libs/halo-ui/`, donde viven el código
fuente, su propio `README.md` y ejemplos de uso.

| Componente | Import                           | Estado         | Código                                                    |
| ---------- | -------------------------------- | -------------- | --------------------------------------------------------- |
| Button     | `@halolib-ui/angular/button`     | **Disponible** | [`libs/halo-ui/button/`](../libs/halo-ui/button/)         |
| Input      | `@halolib-ui/angular/input-text` | **Disponible** | [`libs/halo-ui/input-text/`](../libs/halo-ui/input-text/) |
| Select     | `@halolib-ui/angular/select`     | **Disponible** | [`libs/halo-ui/select/`](../libs/halo-ui/select/)         |

Punto de entrada de soporte (no es un componente visual en sí, pero es consumido
por todos los componentes de arriba):

| Import                     | Rol                                                                                         | Código                                        |
| -------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `@halolib-ui/angular/core` | Theme Engine (`provideHaTheme`) y la capa Foundation (color, espaciado, tipografía, íconos) | [`libs/halo-ui/core/`](../libs/halo-ui/core/) |

El import raíz (`@halolib-ui/angular`, sin subpath) re-exporta todo lo anterior
desde `libs/halo-ui/src/index.ts`.

Para el sistema de tokens (Foundation → Semantic → Component) y las reglas de
theming, ver [Architecture & Foundation](./architecture-and-foundation.md) y
[Theming Deep-Dive](./theming-deep-dive.md).
