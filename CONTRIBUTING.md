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

This repo follows a git-flow-style model:

- `main` — production code. Only updated by merging `develop` in for a release.
- `develop` — integration branch for pre-release work. Base all feature/fix branches off `develop`, and open pull requests against `develop`.

## Submitting a Pull Request

1. Fork the repository and create a branch off `develop`
2. Make your changes with tests
3. Run `pnpm changeset` and commit the generated file alongside your changes
4. Open a pull request against `develop` — CI must pass before merging

## Running Tests

```bash
pnpm test                          # Unit tests (Vitest)
```
