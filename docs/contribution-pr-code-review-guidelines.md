# Contribution / PR / Code Review Guidelines

## Purpose

Defines the code review checklist, the Definition of Done, and repo labels for
`halo-ui`. For the day-to-day contribution workflow — branch setup, commit
conventions, the changeset flow, and the release mechanics — see
[`CONTRIBUTING.md`](../CONTRIBUTING.md) at the repo root, which already covers
that ground accurately; this document does not repeat it. Combine with
[CI/CD Pipeline](./ci-cd-pipeline.md) (the PR checks) and
[Testing Strategy](./testing-strategy.md) (test requirements).

## PR Description Template

`.github/PULL_REQUEST_TEMPLATE.md` exists and GitHub auto-fills it when opening
a new PR (per `CONTRIBUTING.md`, PR titles/descriptions are written in Spanish
in this repo, which is why the template is in Spanish):

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

## Review Checklist

A reviewer should verify:

### Architecture

- [ ] The 6 hard rules are respected (see the `lib-ui-architecture` skill).
- [ ] **gga (Gentleman Guardian Angel) passes** — AI review of the 6 hard
      rules + token system in CI.
- [ ] No new hardcoded colors, spacing, or radius in the component's CSS.
- [ ] No `::ng-deep`, no global selectors, no `!important` outside `:host`.
- [ ] `ViewEncapsulation.None`, `ChangeDetectionStrategy.OnPush`,
      `standalone: true` set.
- [ ] The component is under 400 lines.

### Theming

- [ ] Colors are bound to CSS custom properties on the host, not BEM modifiers.
- [ ] Custom colors (`treasury`, etc.) work with no component changes.
- [ ] Hover/active/contrast states are derived automatically by the Theme
      Engine.

### Forms (CVA)

- [ ] The component implements `ControlValueAccessor`.
- [ ] `NgControl` is resolved lazily (getter over `Injector`,
      `{ self: true, optional: true }`), never as a field initializer.
- [ ] The component works outside a form (no standalone errors).
- [ ] `onChange`, `onTouched`, `setDisabledState` are called correctly.
- [ ] `hasError` reflects `(invalid && touched)`.

### Accessibility

- [ ] Every interactive element is keyboard-navigable.
- [ ] The focus ring is visible (no `outline: none` without a replacement).
- [ ] ARIA attributes are correct (role, `aria-*`, etc.).
- [ ] The `jest-axe` test passes.
- [ ] The component works with screen readers (manual test with VoiceOver/NVDA).
- [ ] `prefers-reduced-motion` is respected for animations.

### Testing

- [ ] Unit tests cover inputs, outputs, signals, state changes.
- [ ] An a11y test with `jest-axe` exists.
- [ ] A showcase route exists with every variant and at least one custom color.
- [ ] Interaction tests for state changes exist (where applicable).
- [ ] Coverage thresholds are met (80/80/90/80).

### Documentation

- [ ] The public API is documented in TSDoc.
- [ ] The affected lib's `README.md` is updated (if user-facing).
- [ ] The showcase route is added/updated (if user-facing).

### Performance

- [ ] The component is under its size budget.
- [ ] No heavy dependencies were added.
- [ ] Tree-shaking is verified.

### CI

- [ ] All CI checks pass (`lint`, `stylelint`, `test`, `build`, `audit`,
      `gga-review`). The `gga-review` job is a required status check and is now
      a hard gate: only `STATUS: PASSED` allows the merge; `FAILED`, an
      ambiguous response, or no `STATUS:` at all blocks the PR.
- [ ] No `[skip ci]` in commit messages.
- [ ] The changeset is correct (packages, bump type, description).

## Definition of Done

A PR is "done" when:

1. All CI checks pass.
2. At least one approval (once the team grows beyond one person).
3. Every review checklist item is checked.
4. The branch is up to date with `main`.
5. Conflicts are resolved.
6. The PR is merged to `main`. The repo has squash, merge commit, and rebase all
   enabled (verified via the repo's merge settings) — no single strategy is
   enforced; the real history mixes all three.

After merge, `release.yml` picks up any changesets and publishes new versions if
there are any — see [Release and Publishing](./release-and-publishing.md).

## Labels

Verified via `gh label list` — these are the labels that actually exist in the
repo:

| Label                  | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| `type:feature`         | New feature or request                     |
| `type:bug`             | Bug fix                                    |
| `type:chore`           | Maintenance, tooling, CI, refactors        |
| `type:docs`            | Documentation only                         |
| `type:breaking-change` | Breaking change                            |
| `type:refactor`        | Code refactoring                           |
| `status:approved`      | Issue approved for implementation          |
| `bug`                  | Something isn't working                    |
| `documentation`        | Improvements or additions to documentation |
| `enhancement`          | New feature or request                     |
| `duplicate`            | This issue or pull request already exists  |
| `good first issue`     | Good for newcomers                         |
| `help wanted`          | Extra attention is needed                  |
| `invalid`              | This doesn't seem right                    |
| `question`             | Further information is requested           |
| `wontfix`              | This will not be worked on                 |

`area:*`, `needs-changeset`, `needs-tests`, `needs-a11y`, `wip`, and
`do-not-merge` do **not** exist in the repo — an earlier version of this page
documented them; they were removed here to match reality.

## Etiquette

- **Be kind.** Reviewers are contributors too. Critique the code, not the
  person.
- **Be specific.** "This could be better" isn't actionable. "Move the `onChange`
  call after `value.set()` to avoid a race condition" is.
- **Be responsive.** Aim to review PRs within 24 hours. Comment early if you
  can't.
- **Be honest.** Ask if something doesn't make sense. Say so, with reasoning, if
  something looks wrong.
- **Disagree and commit.** If author and reviewer can't agree after 2 rounds,
  escalate (for now, the maintainer decides).

## Maintainer Duties

If you're the maintainer:

- Triage issues within 48 hours.
- Review PRs within 24 hours.
- Cut a release every 2 weeks (or as needed).
- Update architecture docs when the architecture changes.
- Communicate breaking changes clearly (in PRs, release notes, and docs).

## Rules of the Team

- Every PR MUST pass all CI checks before merge.
- Every user-facing PR MUST include a changeset.
- Every component PR MUST add/update tests, stories, and the showcase.
- Every PR description MUST follow the template.
- Every review MUST use the checklist (or explain why an item doesn't apply).
- Breaking changes MUST be flagged in the PR title with `!` and in the changeset
  footer.
- No self-merge without a second look (even a solo maintainer should wait 24
  hours for feedback when possible).

## Reference

- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — branch naming, commit conventions,
  the changeset workflow, quick-start commands
- `lib-ui-coding-standards` skill (`skills/lib-ui-coding-standards/SKILL.md`) —
  file structure, input/output conventions, gga review criteria
- [CI/CD Pipeline](./ci-cd-pipeline.md) — the checks referenced above
