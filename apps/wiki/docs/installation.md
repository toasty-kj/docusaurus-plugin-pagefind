---
id: installation
title: Installation
sidebar_position: 2
---

# Installation

## Requirements

- Docusaurus >= 3.0
- Node.js 22.x
- `pagefind` >= 1.0 (installed separately — you control the version)

## Install

```bash
pnpm add docusaurus-plugin-pagefind
pnpm add -D pagefind
```

## Register the plugin

```ts title="docusaurus.config.ts"
const config = {
  plugins: [
    ['docusaurus-plugin-pagefind', {}],
  ],
}
```

Build your site to generate the search index:

```bash
pnpm docusaurus build
```
