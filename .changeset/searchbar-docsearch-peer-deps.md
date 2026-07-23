---
"docusaurus-plugin-pagefind": minor
---

Move `@docsearch/react` and `@docsearch/css` from `dependencies` to
`peerDependencies` so that the swizzled `SearchBar` component resolves them
from the consumer's dependency tree.

**BREAKING:** When the `SearchBar` theme component is ejected via
`docusaurus swizzle`, its imports (`@docsearch/react`, `@docsearch/css`) are
resolved relative to your site rather than the plugin. Previously these were
bundled as plugin `dependencies` and were not reachable from an ejected copy
under strict installers (e.g. pnpm without hoisting), so the ejected component
failed to build. They are now `peerDependencies`; install them in your site:

```bash
npm install @docsearch/react @docsearch/css
```

Package managers that auto-install peer dependencies (npm v7+, pnpm v8+ with
`auto-install-peers`) add them for you; otherwise install them explicitly.
