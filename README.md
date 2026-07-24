# docusaurus-plugin-pagefind

[![npm version](https://img.shields.io/npm/v/docusaurus-plugin-pagefind.svg)](https://www.npmjs.com/package/docusaurus-plugin-pagefind)
[![npm downloads](https://img.shields.io/npm/dw/docusaurus-plugin-pagefind.svg)](https://www.npmjs.com/package/docusaurus-plugin-pagefind)
[![CI](https://github.com/toasty-kj/docusaurus-plugin-pagefind/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/toasty-kj/docusaurus-plugin-pagefind/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/docusaurus-plugin-pagefind.svg)](./LICENSE)

A Docusaurus plugin that integrates [Pagefind](https://pagefind.app/) as a fast,
offline-capable full-text search solution, using the DocSearch UI shell.

🔗 [Live Demo](https://toasty-kj.github.io/docusaurus-plugin-pagefind/)

![demo](./apps/wiki/static/img/demo.gif)

## Features

- Full-text search powered by Pagefind (build-time indexing, no server required)
- DocSearch-style UI: keyboard shortcut (`Ctrl+K` / `Cmd+K`), modal, hit highlighting
- Light and dark theme support out of the box
- Exclude pages from the search index via CSS selectors or glob patterns
- TypeScript support and swizzleable `SearchBar` component

## Requirements

- Docusaurus ≥ 3.0
- Node.js 22.x
- `pagefind` ≥ 1.0

## Installation

```bash
pnpm add docusaurus-plugin-pagefind
pnpm add -D pagefind
```

## Usage

```ts
// docusaurus.config.ts
export default {
  plugins: [
    [
      'docusaurus-plugin-pagefind',
      {
        forceLanguage: 'ja',          // optional: force pagefind language
        excludeGlobs: ['**/hidden/**'], // optional: exclude pages from index
      },
    ],
  ],
}
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `forceLanguage` | `string` | — | Language code passed to pagefind |
| `excludeSelectors` | `string[]` | `.navbar, footer, ...` | Extra CSS selectors excluded from index (added on top of the built-in exclusions) |
| `rootSelector` | `string` | — | Root element for indexing |
| `excludeGlobs` | `string[]` | — | Pages to exclude (glob relative to outDir) |

## Swizzling

```bash
pnpm docusaurus swizzle docusaurus-plugin-pagefind SearchBar
```

The `SearchBar` component depends on `@docsearch/react` and `@docsearch/css`,
which ship as dependencies of this plugin — no extra install is needed for the
default (non-swizzled) search bar.

If you **eject** the component (`--eject`), the copied source lives in your
site's `src/theme`. Most setups resolve the imports transparently, but strict
installers that don't hoist (e.g. pnpm without `shamefully-hoist`) may not reach
the plugin's copy from your site. In that case, install them directly:

```bash
pnpm add @docsearch/react @docsearch/css
```

## Community

- [Contributing Guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security Policy](./SECURITY.md)

## License

MIT
