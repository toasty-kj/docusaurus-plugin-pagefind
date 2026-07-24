# Contributing

## Setup

```bash
git clone https://github.com/toasty-kj/docusaurus-plugin-pagefind
cd docusaurus-plugin-pagefind
pnpm install
pnpm build
pnpm test
```

## Development

See [AGENTS.md](./AGENTS.md) for repository structure, key constraints, and workflow commands.

## Branching

This repo follows a trunk-based model with [Changesets](https://github.com/changesets/changesets):

- `main` — the single long-lived branch. Base all feature/fix branches off `main`, and open pull requests against `main`.
- Merging a feature PR does **not** publish. Instead, each PR carries a changeset file, and a bot maintains a single **"Version Packages"** PR that bumps the version and updates the changelog. Merging that PR is what triggers the release (see [AGENTS.md → Release Process](./AGENTS.md#release-process)).

## Submitting a Pull Request

1. Fork the repository and create a branch off `main`
2. Make your changes with tests
3. Run `pnpm changeset` and commit the generated file alongside your changes
4. Open a pull request against `main` — CI must pass before merging

## Running Tests

```bash
pnpm test                          # Unit tests (Vitest)
```
