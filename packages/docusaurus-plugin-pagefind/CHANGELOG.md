# docusaurus-plugin-pagefind

## 0.2.1

### Patch Changes

- 1b42030: No functional package changes. Bumping to exercise the release pipeline
  fix (running `changeset tag` after publish so `changesets/action` can
  detect a successful publish) and unblock the wiki demo deploy, which has
  been silently skipped since the last two releases.

## 0.2.0

### Minor Changes

- 4eed668: fix `excludeGlobs` silently doing nothing when combined with `rootSelector`

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

- 5cecaf8: fix search returning no results under a non-root baseUrl

  BREAKING: remove the `outputPath` option. The Pagefind index is now always
  written to `<outDir>/pagefind`, which is what makes the runtime index reliably
  fetchable at `<baseUrl>/pagefind/pagefind.js`.

### Patch Changes

- 91d71a7: Run the pagefind indexing step in a plain Node child process
  (`pagefindWorker.mjs`) and remove the `new Function` dynamic-import hack.
  Docusaurus loads plugins through jiti, whose CJS sandbox cannot natively
  `import()` the ESM-only `pagefind` package; a spawned Node process can. No
  public API changes.

## 0.1.1

### Patch Changes

- 789d0db: navbar search button and fix modal empty-state spacing
