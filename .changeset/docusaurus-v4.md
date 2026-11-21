---
"docusaurus-plugin-pagefind": minor
---

Build the `pagefind.js` URL at runtime from `baseUrl` (`useBaseUrl`) and load it with `import(/* webpackIgnore: true */ url)`, instead of baking it into the bundle through webpack externals. On Docusaurus v4, Rspack caches the externals resolution without `baseUrl` in its cache key, so rebuilding with a different `baseUrl` from an unchanged config file (for example `baseUrl` read from an environment variable) shipped a stale URL and broke search.

**Breaking for swizzled (ejected) `SearchBar` components:** `createPagefindSearch` now takes the `pagefind.js` URL. Pass `useBaseUrl('/pagefind/pagefind.js')`.
