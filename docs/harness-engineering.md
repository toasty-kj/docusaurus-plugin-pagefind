# Harness Engineering — how this repo is set up for agents

This repository is worked primarily by coding agents (Codex, Claude Code). This
document explains the *setup* that makes that reliable and the principles behind
it, so the structure survives as the code grows.

It adapts the ideas in OpenAI's [*Harness Engineering: Using Codex in an
Agent-First World*](https://openai.com/index/harness-engineering/) (Ryan
Lopopolo, 2026) to a small open-source Docusaurus plugin. The article's context
was a ~1M-line internal product; the principles scale down, the ceremony does
not. Apply them in proportion.

## The core idea

> The discipline shows up in the scaffolding more than in the code itself.

The human's job is not to write lines — it is to design the environment, state
intent clearly, and build the feedback loops an agent needs to work reliably.
The scarce resource is human attention. Everything below spends effort once, in
the repo, so it pays off on every future agent run.

## Principles, applied here

### 1. A map, not a manual

A giant instruction file fails predictably: it crowds out the actual task,
makes everything "important" (so nothing is), and rots silently. Instead:

- **`AGENTS.md` is the map** (~100 lines): repository structure, the handful of
  non-obvious constraints, workflow commands. It points outward rather than
  containing everything.
- **`CLAUDE.md` is a symlink to `AGENTS.md`** — one source of record, read by
  every agent harness. Never let the two drift.
- **Deeper knowledge lives in `docs/`** and is linked from the map, so an agent
  starts small and is told where to look next (progressive disclosure).

### 2. The repo is the system of record

If an agent can't reach it in context, it effectively does not exist. A decision
in Slack, a Google Doc, or someone's head is invisible to the next run — exactly
like it would be to an engineer who joins in three months.

- Durable rationale goes into **PR descriptions, commit messages, and `docs/`** —
  versioned artifacts the agent can read.
- External API docs the plugin depends on are **vendored locally** as curated
  `*-llms.txt` files under [`docs/references/`](./references/index.md), scoped to
  the surface actually called — so the agent reasons about `pagefind` and the
  Docusaurus plugin API without leaving the repo.
- Working notes (`docs/superpowers/` design specs and plans) are **local-only and
  never committed** (see AGENTS.md → Working Notes Policy). They go stale the
  moment the implementation lands; the durable version is the committed doc.
- When a review comment or a bug reveals a missing rule, **promote it**: into a
  doc if it's guidance, into the linter if it's an invariant.

### 3. Enforce invariants mechanically, don't micromanage style

Agents work best inside strict boundaries with local freedom. Encode the
boundaries once and they apply everywhere, on every run — a preference becomes an
amplifier. Don't dictate implementation details the model can choose well itself.

Already mechanical in this repo:

- **Biome** with the recommended preset **plus `noExcessiveCognitiveComplexity:
  error`** — a hard ceiling on tangled code (`biome.json`).
- **Husky + lint-staged** run `biome check --write` on every commit.
- **Changeset presence** is a CI gate (`.github/workflows/changeset-check.yml`):
  a PR that changes the published package without a changeset fails, so a release
  can never silently ship undocumented — the omission surfaces at review time
  instead of relying on the contributor to remember.
- **Structural invariants in code, not prose**: e.g. `resolveOptions` makes
  `excludeSelectors` *additive* so the default chrome exclusions can never be
  silently dropped; `runPagefind` takes an injectable `load` so tests never touch
  the real ESM package.
- **Typecheck + build** are the objective gates (`pnpm typecheck`, `pnpm build`);
  note typecheck deliberately skips `src/theme/**`, so theme changes are verified
  by build.

The rule of thumb: if you find yourself repeating a correction in reviews,
that's a signal to move it from prose into a lint rule or a test.

### 4. Make the system legible to the agent

An agent fixes what it can observe. Lower the cost of observation:

- The **`apps/wiki` demo site** is a runnable instance an agent can build and
  serve (`pnpm dev:wiki`) to reproduce and verify search behavior end to end.
- The **`e2e/` Playwright harness** auto-starts the wiki and drives a real
  browser — the place to make UI/search regressions observable (currently a
  scaffold; growing it is the highest-leverage legibility investment here).
- Unit tests live beside source (`src/**/*.spec.ts`, Vitest) so behavior is
  checkable in seconds.

### 5. Throughput changes the merge philosophy

When agent throughput exceeds human review capacity, fixing forward is cheap and
waiting is expensive. Keep PRs short-lived and merge gates minimal-but-real
(CI green, changeset present). Prefer a fast follow-up over blocking a branch on
a flake. Every change ships with a `pnpm changeset`; release is automated from
`main` via the Changesets bot.

### 6. Fight entropy continuously (garbage collection)

Agents replicate whatever patterns already exist — including the uneven ones — so
drift is inevitable without maintenance. Pay the debt down in small, continuous
increments rather than in a painful quarterly cleanup:

- Keep the map and docs honest; when code behavior diverges from a doc, the doc
  is the bug — fix or delete it.
- Small, targeted refactor PRs that realign a single pattern are cheap to review
  and safe to land often.

## What's in place vs. worth adding

| Practice | Status |
|---|---|
| Lean `AGENTS.md` map + `CLAUDE.md` symlink | ✅ in place |
| Local-only working notes policy | ✅ in place |
| Mechanical style/complexity enforcement (Biome, husky) | ✅ in place |
| Injectable seams for testability | ✅ in place |
| Runnable demo instance (`apps/wiki`) | ✅ in place |
| Automated release (Changesets) | ✅ in place |
| Changeset presence enforced in CI | ✅ in place |
| Vendored API references (`docs/references/*-llms.txt`) | ✅ in place |
| Browser-level E2E coverage | 🚧 scaffold only — grow `e2e/tests/` |
| CI-enforced doc freshness / link-check | ⬜ not yet |

## Source

Ryan Lopopolo, *Harness Engineering: Using Codex in an Agent-First World*,
OpenAI, 2026-02-11 — https://openai.com/index/harness-engineering/
