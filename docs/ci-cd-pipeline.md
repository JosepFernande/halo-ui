# CI/CD Pipeline

## Purpose

Defines the CI/CD pipeline for `halo-ui`: the jobs, the checks, the triggers,
the artifacts, the release flow, and the branch protection rules. This is the
contract for how code moves from a PR to a published package.

Complement this with
[Contribution & PR Guidelines](./contribution-pr-code-review-guidelines.md) (the
PR process), [Testing Strategy](./testing-strategy.md) (which tests run), and
[Release and Publishing](./release-and-publishing.md) (the release workflow
itself). Everything below was verified line-by-line against the real workflow
files in `.github/workflows/` and against the live repo configuration (branch
protection, secrets, labels, merge settings) — there is no local equivalent of
this page prior to this migration, so precision matters more here than
elsewhere.

## Provider and Infrastructure

| Item            | Choice                                                 | Rationale                                                              |
| --------------- | ------------------------------------------------------ | ---------------------------------------------------------------------- |
| CI provider     | **GitHub Actions**                                     | The repo is on GitHub; no third-party CI needed for v1.                |
| Runners         | `ubuntu-latest`                                        | Linux ships Chrome preinstalled in case a future visual test needs it. |
| Cache           | **Local Nx cache** (`.nx/cache` restored between jobs) | Nx Cloud is deferred (see Nx workspace setup).                         |
| Package manager | **npm**                                                | Per the project's versioning conventions.                              |
| Node version    | **pinned via `.nvmrc`**                                | Angular 19 + Nx 20 require Node 18.19+; the repo pins a newer LTS.     |

## Workflow Overview

There are four workflows in `.github/workflows/` (verified via
`gh workflow list`: `CI`, `Release`, `Smoke`, `Deploy Pages` — all `active`):

1. **`ci.yml`** — runs only on `pull_request` (not on push to `main`). Lint,
   stylelint, test, build, audit, gga-review. Must pass before merge (see branch
   protection below).
2. **`release.yml`** — runs on every push to `main` that touches `libs/**`,
   `.changeset/**`, `package.json`, `package-lock.json`, or the workflow file
   itself. With pending changesets, it opens a **Release PR** with the version
   bumps (does not commit to `main` directly), enables auto-merge for that PR,
   polls until the PR merges, and then — in the same run — builds, validates,
   publishes to npm, creates a git tag, and cuts a GitHub Release.
3. **`smoke.yml`** — runs on every push to `main` whose paths are ignored by
   `release.yml` (docs-only or similar). Build-only, lightweight: branch
   protection already requires the branch to be up to date with `main` before
   merging, so re-running lint/test/audit would be pure duplication; this job
   only catches environment failures (registry down, rotated secret, runner
   drift) independent of the code.
4. **`deploy-pages.yml`** — runs on every push to `main` that touches
   `apps/showcase/**`, `libs/**`, or the workflow file itself. Builds
   `apps/showcase` with
   `nx build showcase --configuration=production --base-href=/halo-ui/` and
   deploys the output to GitHub Pages. See [Showcase](./showcase.md).

## `ci.yml` (PR checks)

**Trigger:** `pull_request` only — does not run on push to `main` (that's
`smoke.yml`'s job).

**Concurrency:** cancels in-progress runs for the same ref.

`test` and `build` run with `nx run-many` (every project), not `nx affected`.
CSS linting is a separate job (`stylelint`), not a step inside `lint`. `audit`
runs two scripts (`tools/audit/index.ts` and `tools/audit/bundle-check.ts`) with
`tsx`.

`test` runs with `--coverage`, and the `coverageThreshold` (80% lines, 80%
branches, 90% functions, 80% statements) is centralized in `jest.preset.cjs` —
libs inherit it without duplicating it. If a lib falls below threshold, Jest
fails the `test` job (a real gate, not just a report).

Every job (`lint`, `stylelint`, `test`, `build`, `gga-review`) independently
runs its own `actions/checkout@v4` + `actions/setup-node@v4` (Node version from
`.nvmrc`, npm cache) + `npm ci` (`HUSKY=0`) + Nx cache restore — the `setup`
job's `needs: setup` dependency only orders the workflow, it does not share
filesystem state across jobs (each runs on its own runner).

```yaml
name: CI

on:
  pull_request:

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npx nx run-many -t lint

  stylelint:
    runs-on: ubuntu-latest
    steps:
      - run: npx nx run-many -t stylelint

  test:
    runs-on: ubuntu-latest
    steps:
      - run: npx nx run-many -t test --coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: coverage/

  build:
    runs-on: ubuntu-latest
    steps:
      - run: npx nx run-many -t build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  audit:
    needs: [setup, build]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist
      - run: npx tsx tools/audit/index.ts
      - run: npx tsx tools/audit/bundle-check.ts

  gga-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      # Installs opencode + gga, patches gga's status parser and PR template
      # (see "AI Code Review" below), runs `gga run --pr-mode --ci`, and
      # always comments the verdict on the PR via `gh pr comment`.
      # A STATUS: FAILED here fails the job and blocks the merge.

  summary:
    needs: [lint, stylelint, test, build, audit, gga-review]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Check all required jobs passed
        run: |
          if [[ "${{ needs.lint.result }}" != "success" || \
                "${{ needs.stylelint.result }}" != "success" || \
                "${{ needs.test.result }}" != "success" || \
                "${{ needs.build.result }}" != "success" || \
                "${{ needs.audit.result }}" != "success" || \
                "${{ needs.gga-review.result }}" != "success" ]]; then
            echo "One or more required jobs failed."
            exit 1
          fi
```

(Abridged for readability — every job repeats the full
checkout/setup-node/npm-ci/cache-restore preamble shown once in "Provider and
Infrastructure" above; see the real `ci.yml` for the literal steps.)

**Required status checks** (verified via
`gh api repos/:owner/:repo/branches/main/protection`): `audit`, `build`, `lint`,
`test`, `gga-review`, `stylelint`. The `gga-review` job is a hard gate: it no
longer uses `continue-on-error`, so if `gga run --pr-mode --ci` returns
`STATUS: FAILED`, the job fails, the workflow run fails, and branch protection
blocks the merge. The PR always receives a comment with the verdict because the
comment step runs `always()`.

## `release.yml` (main only)

**Trigger:** push to `main`, filtered by `paths` (`libs/**`, `.changeset/**`,
`package.json`, `package-lock.json`, `.github/workflows/release.yml`) — a
docs-only merge does not trigger this workflow.

**Timeout:** `timeout-minutes: 45` at the job level — covers the
version-packages PR's own required checks (observed ~12 min on a real run) plus
build, validation, audit and publish without blocking the `release-main`
concurrency group for hours if an `npm ci`/publish hangs.

**Real behavior — Release PR pattern with auto-merge + polling:**

- The "Check for changesets" gate is a custom script, not `changeset status`. It
  compares the existing `.md` files against `.changeset/pre.json`'s `changesets`
  array only when `pre.json` exists and its `mode` is `"pre"`; if `pre.json`
  doesn't exist (the repo's real state today — see
  [Release and Publishing](./release-and-publishing.md)) or its `mode` is
  `"exit"`, any pending `.md` file counts as pending unconditionally.
- If there are pending changesets: runs `npx changeset version`, opens a
  **Release PR** (`peter-evans/create-pull-request@v7`, branch
  `release/version-packages`) with the version bumps and CHANGELOGs, and enables
  `gh pr merge --auto --squash` on it. The job then polls the PR state (up to
  ~20 min) until it merges; because GitHub Actions does not trigger new workflow
  runs for pushes made with `GITHUB_TOKEN`, the publish must continue in this
  same run rather than waiting for a second `release.yml` invocation.
- Once the Release PR merges (or if there were no pending changesets from the
  start): runs `npx nx build halo-ui --configuration=production`, runs
  `npm audit --omit=dev --audit-level=critical` as a **non-blocking** step
  (`continue-on-error: true`) and uploads the JSON report as an artifact instead
  of failing the job, runs `npm run validate:packages` as a **blocking** step
  (fails the release if `dist/libs/halo-ui/package.json` lost any required
  subpath export, its `main`/`exports["."]`/`typings`, or if the workflow
  stopped publishing from `dist/libs/halo-ui`), publishes `@halolib-ui/angular`
  directly from `dist/libs/halo-ui` with
  `npm publish "dist/libs/halo-ui" --access public` (not via
  `changeset publish`), and, if it actually published something new, creates a
  `release-v<version>` tag and a GitHub Release named after that real version.

See [Release and Publishing](./release-and-publishing.md) for the full publish
loop, the prerelease/`alpha` dist-tag logic, and the historical bugs this
workflow's shape was built to avoid.

## `smoke.yml` (post-merge, push to `main`)

**Trigger:** `push` to `main`.

Single `build` job, no lint/test/audit — branch protection with `strict: true`
already requires the branch to be up to date with `main` before merging, so the
commit landing on `main` was already validated in that exact state by the PR's
CI. This job only covers what the PR can't: environment failures (npm registry
down, rotated secret, runner drift).

The `apps/showcase` app builds and lints alongside every other project as part
of `ci.yml`'s regular `nx run-many` steps, and is also deployed by
`deploy-pages.yml` on relevant pushes. See [Showcase](./showcase.md).

## `deploy-pages.yml` (GitHub Pages deploy)

**Trigger:** `push` to `main`, filtered by `paths` (`apps/showcase/**`,
`libs/**`, `.github/workflows/deploy-pages.yml`).

Two jobs:

1. **`build`** — checks out the repo, installs dependencies, restores the Nx
   cache, runs `actions/configure-pages@v5`, builds the showcase with
   `npx nx build showcase --configuration=production --base-href=/halo-ui/`, and
   uploads `dist/showcase/browser` as a Pages artifact.
2. **`deploy`** — depends on `build`, runs in the `github-pages` environment,
   and deploys the artifact with `actions/deploy-pages@v4`.

Permissions: `contents: read`, `pages: write`, `id-token: write`. Concurrency
group `pages` with `cancel-in-progress: false` so an in-flight deploy is never
interrupted.

## Required Secrets

Configured in GitHub repo settings → Secrets and variables → Actions. Verified
via `gh secret list` — exactly two configured secrets exist today:

| Secret             | Used by                     | Required for                         |
| ------------------ | --------------------------- | ------------------------------------ |
| `NPM_TOKEN`        | `release.yml`               | Publishing to npm                    |
| `OPENCODE_API_KEY` | `ci.yml` (`gga-review` job) | Model inference for the AI PR review |

`GITHUB_TOKEN` is provided automatically by GitHub on every workflow run — it is
not a configured repo secret. No `GH_TOKEN` or Nx Cloud secrets are required
(remote caching remains unused; only local caching is configured).

## Branch Protection (`main`)

Configured in GitHub repo settings → Branches → Branch protection rules.
Verified live via `gh api repos/:owner/:repo/branches/main/protection`:

- **Require a pull request before merging:** ON
- **Required approving reviews:** 0 (single-maintainer project for now; raise to
  1+ as the team grows)
- **Dismiss stale PR approvals on new commits:** ON
- **Require status checks to pass:** ON — required contexts: `audit`, `build`,
  `lint`, `test`, `gga-review`, `stylelint`; `strict: true` (branch must be up
  to date with `main`)
- **Require conversation resolution before merging:** ON
- **Require signed commits:** OFF (deferred; enable as the team grows)
- **Require linear history:** OFF
- **Include administrators:** ON (no bypass, not even for admins)
- **Allow force pushes:** OFF
- **Allow deletions:** OFF

Repo merge settings (`gh api repos/:owner/:repo`) allow all three merge
strategies — squash, merge commit, and rebase — no single strategy is enforced;
the real history mixes all three.

## Local Pre-Commit Hooks (husky)

**`pre-commit`** — runs on every `git commit`, using `gga` + `lint-staged`:

```bash
# ======== GGA START ========
if command -v gga >/dev/null 2>&1; then
  gga run || exit 1
fi
# ======== GGA END ========

npx lint-staged
```

`lint-staged` (config in `.lintstagedrc`) applies, only to staged files:

- `*.ts` → `eslint --fix`
- `libs/**/*.css` → `stylelint`
- everything else (except `.claude/**`) → `prettier --write --ignore-unknown`

**`commit-msg`** — runs on every `git commit` to enforce Conventional Commits:

```bash
npx --no-install commitlint --edit "$1"
```

**`pre-push`** — runs on every `git push`, against `origin/main`:

```bash
eval "$(fnm env --use-on-cd)"
npx nx affected -t build --base=origin/main
```

`fnm env --use-on-cd` ensures the Node version managed by `fnm` is active before
`nx` runs; without it the hook may fail on machines where the system Node does
not match `.nvmrc`.

## Native binary workaround on Linux CI

Every workflow that runs `npm ci` on `ubuntu-latest` includes a temporary step
(labeled
`Fix missing lightningcss/@tailwindcss-oxide native binaries on Linux CI`) that
reinstalls `lightningcss` and `@tailwindcss/oxide-linux-x64-gnu` with
`--no-save`.

**Why:** `package-lock.json` only retains resolved optionalDependency metadata
for the platform that last ran `npm install` (Windows in this repo), so `npm ci`
on Linux cannot resolve the native binaries that `@tailwindcss/postcss` needs at
Angular/PostCSS compile time. Unlike `esbuild`, neither binary has a fallback
postinstall that downloads the missing platform binary on demand.

**Critical detail:** both packages are installed in a **single** `npm install`
invocation. Running two separate `npm install` commands does not work because
each invocation prunes "extraneous" packages from the whole `node_modules`, and
since these binaries are intentionally not saved to the lockfile, a second run
would delete the binary the first run just added. This is tracked as issue #146.

## Failure Handling

| Failure                   | Action                                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| CI red on a PR            | The author fixes the failure and pushes a new commit; CI re-runs automatically.                                             |
| Flaky test                | Use GitHub's "Re-run jobs" on the failed job. No special configuration.                                                     |
| Coverage below threshold  | Add tests until the threshold is met, or (rarely) the team agrees to lower it with documented justification.                |
| Build fails on `main`     | Revert the responsible commit immediately with `git revert`. Investigate offline.                                           |
| Release fails mid-publish | The publish loop skips versions already on npm, so re-running the workflow continues where it left off.                     |
| Secret leak               | Rotate the secret immediately. Audit npm for any package published from the leak. Add the secret to GitHub push protection. |

## Environment Notes

CI runs on GitHub-hosted Linux runners with Chrome preinstalled — different from
local development, which has its own constraints:

- **Local and CI:** Jest with jsdom (`jest-preset-angular`'s default) is the
  only test runner — there's no Karma configuration in the repo, so no Chrome
  dependency to run tests locally.
- **Visual regression testing** (Chromatic, Percy, or similar) is deferred. When
  introduced, it will run only in CI, not locally.

## AI Code Review (active — v1)

**Tool:**
[Gentleman Guardian Angel (gga)](https://github.com/Gentleman-Programming/gentleman-guardian-angel)
— provider-agnostic AI code review.

**Real provider:** `opencode:opencode-go/deepseek-v4-flash` (configured in
`.gga`) — **not** GitHub Models/`gpt-4o-mini`. `GITHUB_TOKEN` is only used to
post the verdict comment on the PR (`gh pr comment`), not for model inference.

**Where it runs:**

1. **Pre-commit hook** (local, active) — `.husky/pre-commit` runs `gga run` if
   the binary is installed.
2. **CI PR-mode** (`ci.yml`, `gga-review` job) — reviews the full PR diff. It is
   listed as a required status check in branch protection and is now a hard
   gate. The job captures the full `gga run` output, parses the **last**
   `STATUS: PASSED|FAILED` line using the same normalization rules as the
   patched `parse_review_status()`, and the step's exit code is driven by that
   verdict: `PASSED` lets the job succeed; anything else (`FAILED`, `AMBIGUOUS`,
   or no `STATUS:` at all) fails the job and blocks the merge. This keeps the PR
   comment and the job state in perfect sync.
3. **Automatic PR comment** — the job always posts the verdict (✅ APROBADO / ❌
   RECHAZADO, rule-to-evidence table in Spanish), with a fallback to "⚪ NO
   APLICA" (no files matching `FILE_PATTERNS`) or "❌ FALLÓ" (crash/timeout with
   no verdict) — the PR is never left without a comment.

**Rule source:** `AGENTS.md` is an **index** pointing to skills
(`lib-ui-architecture`, `lib-ui-coding-standards`, `lib-ui-testing`,
`github-issues-from-docs`), it does not contain the rules inline. `gga` does a
literal `cat` of `AGENTS.md` (it does not follow links); it's the agentic
provider (`opencode`, with `skill`/`glob`/`Read` tools) that resolves those
names at runtime.

**The real CI job** is more elaborate than a standard install — it clones
`gentleman-guardian-angel` into `/tmp/gga` and rewrites its
`parse_review_status()` function entirely to scan the **whole** model output and
keep the **last** `STATUS:` match (falls back to `AMBIGUOUS` if both PASSED and
FAILED appear), instead of the upstream fixed-line-window approach. It also
patches `lib/pr_mode.sh` to inject a mandatory Spanish response template. Uses
the `OPENCODE_API_KEY` secret for model inference.

**Cost control:**

- Runs only on PRs (not on every push)
- Uses `opencode:opencode-go/deepseek-v4-flash` (configured in `.gga`), which
  requires an active OpenCode subscription — model inference is **not free**;
  it's billed against the `OPENCODE_API_KEY` repository secret (see
  [Required Secrets](#required-secrets))
- gga's caching skips files unchanged between PR updates

### Local Provider Override

CI's provider is fixed in `.gga` for reproducibility, but developers are not
locked into it locally. `gga` resolves its config in this precedence order
(later wins): hardcoded defaults → `~/.config/gga/config` (user global) → `.gga`
(project, committed) → `GGA_*` environment variables.

Override the provider for a local run — Claude, Codex, GitHub Models, Ollama,
etc. — without touching `.gga`, by exporting `GGA_*` variables first:

```bash
# Use Claude instead of OpenCode
export GGA_PROVIDER="claude"
gga run

# Use Codex
export GGA_PROVIDER="codex"
gga run

# Use GitHub Models
export GGA_PROVIDER="github:gpt-4o"
gga run

# Use local Ollama
export GGA_PROVIDER="ollama:llama3.2"
gga run
```

Supported override variables:

| Variable               | Overrides          |
| ---------------------- | ------------------ |
| `GGA_PROVIDER`         | `PROVIDER`         |
| `GGA_TIMEOUT`          | `TIMEOUT`          |
| `GGA_OPENCODE_VARIANT` | `OPENCODE_VARIANT` |
| `GGA_OPENCODE_AGENT`   | `OPENCODE_AGENT`   |

## Future Improvements (v2+)

- **Dependabot** — automated dependency PRs
- **Signed commits** — enable in branch protection as the team grows
- **Auto-label PRs** — GitHub Actions labeling by scope (`area:button`,
  `area:theme`, etc.)
- **Performance budgets in CI** — fail if bundle size exceeds thresholds
- **Visual regression** — Chromatic, Percy, or similar
- **Slack/Linear notifications** — on CI failure or release published

## Rules of the Team (enforced by CI)

- No PR merges without green CI.
- Coverage thresholds (80/80/90/80) are enforced via the centralized
  `coverageThreshold` in `jest.preset.cjs` plus `--coverage` in the `test` job —
  a run below threshold fails CI.
- Any change to `.github/workflows/**` requires a second reviewer (CI is
  critical infrastructure).
- Any change to `tools/audit/**` (the custom audit script) requires a second
  reviewer.
- Skipping CI (e.g. `[skip ci]` in commit messages) is **forbidden** for any
  commit touching `apps/**`, `libs/**`, or `tools/**`. The only exception is
  `[skip ci]` for a CHANGELOG-only or docs-only change.
