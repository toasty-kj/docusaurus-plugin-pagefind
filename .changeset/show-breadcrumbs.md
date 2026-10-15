---
"docusaurus-plugin-pagefind": minor
---

Show the Docusaurus breadcrumbs of a page with its search results (e.g. `Guides › Deployment`), and `Guides › Deployment › Docker` for the sections of a page, so that results with the same title in different sections can be told apart. The breadcrumbs are read from each page at build time and indexed as Pagefind `breadcrumb` metadata; a page can set its own with `data-pagefind-meta="breadcrumb:…"`. Disable with the new `breadcrumbs: false` option.
