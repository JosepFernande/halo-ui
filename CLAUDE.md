# halo-ui — Agent Skills Index

When working on this project, load the relevant skill(s) BEFORE writing any
code.

## How to Use

1. Check the trigger column to find skills that match your current task
2. Load the skill by reading the SKILL.md file at the listed path
3. Follow ALL patterns and rules from the loaded skill
4. Multiple skills can apply simultaneously

## Skills

| Skill                     | Trigger                                                                                                                                                                                                                             | Path                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `lib-ui-architecture`     | Implementing, refactoring, or reviewing halo-ui Angular components, tokens, theming, or SDD phases.                                                                                                                                 | [`skills/lib-ui-architecture/SKILL.md`](skills/lib-ui-architecture/SKILL.md)         |
| `lib-ui-coding-standards` | Writing component logic, templates, styles, tests, or PRs. Defines file structure, input/output patterns, signal usage, CSS conventions, and gga review criteria.                                                                   | [`skills/lib-ui-coding-standards/SKILL.md`](skills/lib-ui-coding-standards/SKILL.md) |
| `lib-ui-testing`          | Writing or reviewing tests. Defines TestBed + Test Host pattern, jest-axe a11y, CDK mocking, coverage thresholds, and required describe blocks per component.                                                                       | [`skills/lib-ui-testing/SKILL.md`](skills/lib-ui-testing/SKILL.md)                   |
| `github-issues-from-docs` | crear issue, GitHub issue, US-XX, revisar issue, alinear issue con documentación. Crear y revisar issues de GitHub alineados con la documentación técnica de `docs/`, usando un índice de tags local para elegir qué archivos leer. | [`skills/github-issues-from-docs/SKILL.md`](skills/github-issues-from-docs/SKILL.md) |
| `lib-ui-release`          | hacer un release, publicar a npm, por qué no se publicó, trabajar con `.changeset/`, revisar el workflow `release.yml`. Checklist operativo del pipeline de release y validación de paquetes antes del publish (validate-packages). | [`skills/lib-ui-release/SKILL.md`](skills/lib-ui-release/SKILL.md)                   |
| `lib-ui-version-align`    | PR, release, version, showcase, `@halolib-ui/angular`, align version. Mantener alineada la versión mostrada en el showcase con `libs/halo-ui/package.json`.                                                                         | [`skills/lib-ui-version-align/SKILL.md`](skills/lib-ui-version-align/SKILL.md)       |

## Project Language Override

This overrides the global Language Domain Contract (`~/.claude/CLAUDE.md`) and
the persona output-style default (`~/.claude/output-styles/gentleman.md`) for
this repository only. It applies regardless of which agent/tool is reading this
file (Claude Code, OpenCode, gga, etc.).

### Collaboration artifacts → always Spanish

Always write these in neutral/professional Spanish, without asking each time:

- Commit messages
- Pull request titles and descriptions
- GitHub issue titles and descriptions
- PR/issue comments

This applies regardless of the conversation language used to request the work.

### Code artifacts → always English (unchanged)

The general rule still applies as-is: source code, identifiers, code comments,
UI copy/labels, docs, tests, and any string literal inside source code default
to English. Do not translate these to Spanish unless explicitly requested for
that specific artifact.
