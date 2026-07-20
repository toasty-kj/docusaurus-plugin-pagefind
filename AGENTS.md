# AGENTS.md — Development Guide for AI Agents & Contributors

This file is the map. `CLAUDE.md` is a symlink to it, so Codex and Claude read the
same source of record. For *how* this repo is set up to be worked by agents (the
principles behind that choice), see [`docs/harness-engineering.md`](./docs/harness-engineering.md).

## Repository Structure

```
packages/docusaurus-plugin-pagefind/   # Publishable npm package
  src/
    index.ts                           # Plugin entry point (Docusaurus lifecycle methods)
    options.ts                         # PluginOptions interface + resolveOptions (additive excludeSelectors)
    runPagefind.ts                     # Runs the Pagefind Node API (createIndex/addDirectory/writeFiles)
    injectIgnoreMarkers.ts             # Adds data-pagefind-ignore to excluded HTML pages
    theme/SearchBar/
      index.tsx                        # SearchBar React component (swizzleable)
      PagefindClient.ts                # Wraps Pagefind API in Algolia-compatible shape
      transformHits.ts                 # Maps Pagefind results to DocSearch hit objects
      styles.css                       # Modal and hit row styles (light/dark CSS vars)
  dist/                                # tsc output — gitignored, included in npm package

apps/wiki/                             # Demo and documentation Docusaurus site
e2e/                                   # Playwright E2E tests (scaffold only)
```

## Architecture & Key Constraints

The build-time/client-side split and the non-obvious invariants — theme path
semantics, webpack externals, the ESM-only pagefind worker, `@docusaurus/utils`
avoidance, and the two-tsconfig build — live in
[`docs/architecture.md`](./docs/architecture.md). **Read it before changing the
plugin entry point (`index.ts`), the indexing worker, or the theme.**

## Development Workflow

```bash
pnpm install               # Install all workspace dependencies
pnpm build                 # Compile plugin (tsc → dist/)
pnpm test                  # Run Vitest unit tests
pnpm typecheck             # tsc --noEmit (plugin only; skips src/theme/**)
pnpm dev:wiki              # Build plugin then serve wiki at localhost:3000
pnpm build:wiki            # Full wiki build (runs pagefind postBuild)

# Single test (from package dir or via --filter):
pnpm --filter docusaurus-plugin-pagefind exec vitest run src/options.spec.ts
pnpm --filter docusaurus-plugin-pagefind exec vitest run -t "resolveOptions"

# Lint / format (Biome — tabs, single quotes, no semicolons):
pnpm exec biome check --write
```

`pnpm typecheck` does not cover `src/theme/**` (the theme compiles under a separate
tsconfig with different module resolution) — verify theme changes with `pnpm build`,
not typecheck alone.

## Release Process

1. Make changes and commit
2. Run `pnpm changeset` — choose change type (patch/minor/major) and describe the change
3. Open a PR; the changeset file must be included
4. On merge to `main`, a "Version Packages" PR is opened automatically by the Changesets bot
5. Merging that PR bumps the version and updates `CHANGELOG.md`
6. The resulting version tag triggers `release.yml` → `pnpm publish`

## Code Conventions

- Language: English (all code, comments, docs)
- No comments unless the WHY is non-obvious
- Tests live alongside source: `src/**/*.spec.ts`
- Test framework: Vitest — use `vi.fn()` not `jest.fn()`
- Do not import from `@docusaurus/utils`

## Working Notes Policy

- `docs/superpowers/` (design specs and implementation plans) are local working
  notes — **never commit them**. They go stale as soon as the implementation
  lands and are not kept in sync with the code.
- Durable design rationale belongs in PR descriptions and commit messages
  instead.
