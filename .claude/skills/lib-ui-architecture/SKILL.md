---
name: lib-ui-architecture
description:
  'Trigger: halo-ui, Angular UI library, ha- components, design tokens, theming,
  sdd design spec tasks apply verify. Apply the six hard rules and three-layer
  token system to every halo-ui artifact.'
license: MIT
metadata:
  author: JosepFernande
  version: '1.0'
  project: halo-ui
---

## Activation Contract

Load this skill whenever work targets the `halo-ui` repository: any
implementation, refactor, or review of Angular components, theming, or tokens.
This applies **unconditionally**, regardless of whether the collaborator uses
the SDD workflow — the architecture rules below are a project constraint, not a
byproduct of any particular process.

SDD is optional per collaborator. If a contributor runs an `sdd-*` phase
(explore, propose, spec, design, tasks, apply, verify), this skill also governs
that phase's output — the phase structure doesn't replace the rules, it's just
one way of organizing work that happens to also be bound by them. A contributor
who never touches `sdd-*` is bound by the same rules just the same, applied
directly to their implementation, refactor, or review.

The skill is the operational contract for the architecture documented in the
GitHub Wiki. It does not replace reading the source Wiki page when a decision is
non-obvious.

## Hard Rules (non-negotiable)

1. **Tokens first.** No hardcoded colors, spacing, or radius. Every value comes
   from a token.
2. **Standalone only.** No NgModules. Every component, directive, and pipe is
   `standalone: true`.
3. **Signals first.** Use Signals, not RxJS, for local state, UI state, and
   internal interactions. Reserve RxJS for streams, async events, and interop.
4. **CSS variables first.** Prefer native CSS and custom properties. Reject
   heavy SCSS, mixin stacks, and utility-class frameworks.
5. **CDK over custom.** Use Angular CDK for overlays, a11y, focus, keyboard, and
   scrolling. Do not reimplement.
6. **Consistent APIs.** Naming, inputs, outputs, and variants follow project
   conventions: `ha-` prefix, `size=sm|md|lg`, `variant=solid|outline|ghost`,
   `color` as a string (theme-registered, never a closed enum).

## Token System

Three layers, in order of definition:

1. **Foundation** — raw values: `--primary-600`, `--neutral-500`, `--radius-lg`,
   `--spacing-md`.
2. **Semantic** — `--ha-primary` (and any other consumer-registered color name;
   only `primary` ships by default), plus the non-color passthrough
   `--ha-spacing-*`, `--ha-radius-*`, `--ha-gap-*`, `--ha-icon-size-*`,
   `--ha-font-size-*`.
3. **Component** — `--ha-button-bg`, `--ha-button-color`,
   `--ha-input-focus-ring`.

Scale naming (spacing, radius, font-size, size) is **semantic**
(`sm`/`md`/`lg`), never numeric (`-1`, `-2`, `-4`). This matches the suffix
convention already shipped in component tokens (`button.tokens.ts`,
`input-text.tokens.ts`) — do not introduce a numeric-indexed scale anywhere in
the token system.

Components consume ONLY semantic and component tokens. Foundation tokens are
off-limits inside components. The Theme Engine (`provideHaTheme()`) auto-derives
hover, active, and contrast variants from user-registered colors.

## Decision Gates

| Situation                                                    | Rule                                                                               |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Adding a color, spacing, or radius value                     | Use semantic or component token. Reject hardcoded values.                          |
| Component receives a color input                             | Type as `string` (theme-registered). Reject closed enums.                          |
| Component needs overlay, a11y, focus, keyboard, or scrolling | Use Angular CDK primitives. Reject custom implementations.                         |
| Component local or UI state                                  | Use Signals. Reject `BehaviorSubject` for UI state.                                |
| Cross-component styling                                      | Use component tokens. Reject global utility classes and shared mutable state.      |
| Component file size                                          | Stay within 300–400 lines. Split otherwise.                                        |
| Third-party dependency                                       | Justify it. Default to no — avoid lodash, utility libraries, heavy CSS frameworks. |

## Execution Steps

1. Confirm the change targets the `halo-ui` repo. If the collaborator is running
   an SDD phase, identify which artifact you own for that phase (spec, design,
   task, implementation, verification). If not, apply the rules directly to the
   implementation, refactor, or review at hand — no phase breakdown required.
2. Re-read the Wiki source of truth if any rule application is ambiguous. Do not
   invent.
3. Apply the hard rules to your output: spec criteria, design decisions, task
   acceptance, code, and verification checklist must reference these rules
   explicitly.
4. For each component, place files at
   `libs/<lib>/src/lib/<comp>.{component.ts,component.html,component.css,types.ts,tokens.ts,constants.ts,utils.ts}`
   with `index.ts` at the entry-point root (Nx convention; there is no
   `public-api.ts`).
5. Verification phase: produce a checklist mapping each of the six hard rules to
   the evidence (file, line, test) that proves compliance. Flag any deviation as
   a blocker, not a warning.

## Output Contract

Every phase or direct implementation must return:

- **Rule compliance map**: for each of the 6 hard rules, the artifact(s) that
  satisfy it.
- **Token map**: which semantic and component tokens the change introduces or
  consumes.
- **CDK usage**: which CDK module(s) the change relies on (if any).
- **Limits**: confirm the change respects the 300–400 line component cap.
- **Deviations**: any rule the change cannot satisfy, with rationale and
  proposed follow-up.

## References

- Architecture & Foundation: `../../docs/architecture-and-foundation.md`
- Repo: `https://github.com/JosepFernande/halo-ui`
