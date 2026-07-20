---
"docusaurus-plugin-pagefind": minor
---

fix search returning no results under a non-root baseUrl

BREAKING: remove the `outputPath` option. The Pagefind index is now always
written to `<outDir>/pagefind`, which is what makes the runtime index reliably
fetchable at `<baseUrl>/pagefind/pagefind.js`.
