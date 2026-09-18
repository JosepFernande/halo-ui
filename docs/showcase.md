# Showcase

`halo-ui` uses `apps/showcase` — a real Angular application — as the local
playground for every published component. There is no separate preview tool: the
showcase app imports each component from its public subpath
(`@halolib-ui/angular/button`, `@halolib-ui/angular/input-text`,
`@halolib-ui/angular/select`, ...) exactly as a consumer would.

## Running the showcase locally

```bash
# Start the dev server
npx nx serve showcase

# Build it
npx nx build showcase
```

## Theme registration

The showcase registers the halo-ui theme engine at bootstrap (`provideHaTheme()`
in `apps/showcase/src/app/app.config.ts`), passing a `semantic` config that
registers app-specific colors (`success`, `error`, `warning`, `info`, `neutral`)
alongside the library's default `primary` — this is what powers the color
swatches on the Button page. `provideHaTheme()` writes every
Foundation/Semantic/Component CSS custom property (e.g. `--ha-primary`,
`--ha-button-bg`) inline on `document.documentElement` — no separate Foundation
stylesheet is loaded via the `build`/`serve` target's `styles` array.

## Adding a showcase route for a new component

1. Create a standalone page component under
   `apps/showcase/src/app/pages/<component>-page/`, importing the library
   component from its public entry point (`@halolib-ui/<lib>`).
2. Demonstrate the component's main variants, sizes, colors, and states (no need
   to cover every combination) — this is a working playground, not exhaustive
   documentation.
3. Register the page in `apps/showcase/src/app/app.routes.ts`.
4. Add a link to the new route in the nav
   (`apps/showcase/src/app/app.component.html`).

## CI

The showcase app builds and lints as part of the regular `ci.yml` workflow's
`npx nx run-many -t lint` / `-t build` steps, alongside every other project.

In addition, `.github/workflows/deploy-pages.yml` runs on every push to `main`
that touches `apps/showcase/**`, `libs/**`, or the workflow file itself. It
builds the showcase with:

```bash
npx nx build showcase --configuration=production --base-href=/halo-ui/
```

and deploys `dist/showcase/browser` to GitHub Pages. The `base-href=/halo-ui/`
value matches the repository name so the deployed app resolves its assets
correctly under the `https://<org>.github.io/halo-ui/` path.
