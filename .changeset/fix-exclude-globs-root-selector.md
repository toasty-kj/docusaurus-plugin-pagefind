---
"docusaurus-plugin-pagefind": minor
---

fix `excludeGlobs` silently doing nothing when combined with `rootSelector`

Previously, excluded pages were indexed anyway and merely marked with
`data-pagefind-ignore="all"` on `<body>`. `rootSelector` (e.g. `main`) makes
Pagefind scan only that subtree, so the marker on the ancestor `<body>` was
never seen and the excluded page stayed searchable.

`excludeGlobs` now filters files out before they are ever handed to Pagefind
(via `addHTMLFile` instead of `addDirectory`), so exclusion holds regardless
of any other indexing option.

BREAKING: built HTML output no longer has `data-pagefind-ignore="all"`
injected into excluded pages' `<body>` tags. Nothing should depend on that
implementation detail, but flagging it since it changes build output.
