---
id: configuration
title: Configuration
sidebar_position: 3
---

# Configuration

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `forceLanguage` | `string` | — | Language code passed to pagefind (e.g. `'ja'`) |
| `excludeSelectors` | `string[]` | `.navbar, footer, ...` | Extra CSS selectors excluded from the index. Added on top of the built-in Docusaurus chrome exclusions, not a replacement |
| `rootSelector` | `string` | — | Root element for indexing (default: full body) |
| `excludeGlobs` | `string[]` | — | Glob patterns for pages to exclude from the index |

## Example

```ts title="docusaurus.config.ts"
const config = {
  plugins: [
    [
      'docusaurus-plugin-pagefind',
      {
        forceLanguage: 'ja',
        // Added on top of the built-in exclusions (navbar, footer, sidebar, …)
        excludeSelectors: ['.my-custom-widget'],
        excludeGlobs: ['**/internal/**'],
      },
    ],
  ],
}
```

## Swizzling

The `SearchBar` component can be swizzled for customization:

```bash
pnpm docusaurus swizzle docusaurus-plugin-pagefind SearchBar
```
