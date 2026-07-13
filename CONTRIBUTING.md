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

## Submitting a Pull Request

1. Fork the repository and create a branch
2. Make your changes with tests
3. Run `pnpm changeset` and commit the generated file alongside your changes
4. Open a pull request — CI must pass before merging

## Running Tests

```bash
pnpm test                          # Unit tests (Vitest)
```
