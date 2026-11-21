# Architecture

Deep reference for the plugin's design and the non-obvious invariants. `AGENTS.md`
is the map and links here; read this before changing the plugin entry point
(`index.ts`), the indexing worker, or the theme.

For the exact API surfaces this plugin calls, see the local references in
[`references/`](./references/index.md) (Pagefind Node API, Docusaurus plugin API).

## Two halves, two runtimes

The package is split into two parts that run in different environments and never
share a module.

### Build-time — the Docusaurus plugin (Node, CJS)

`src/index.ts` is the plugin. Its `postBuild` hook indexes the built site with
Pagefind (`runPagefind.ts`):

1. Collects the built HTML files, dropping any that match `excludeGlobs`.
2. Rewrites each file's HTML to inject `data-pagefind-meta="breadcrumb:…"` from
   the Docusaurus breadcrumbs (`breadcrumbMeta.ts`; skipped when
   `breadcrumbs: false`).
3. Hands each file to Pagefind with `addHTMLFile`, then writes the index.

The catch: Pagefind's Node API is **ESM-only**, and Docusaurus loads plugins
through jiti's CJS sandbox, where `import('pagefind')` fails (both plain dynamic
import and the `new Function` escape hatch are broken by the transform). The fix:
`postBuild` spawns a plain Node child process via `process.execPath` running
`pagefindWorker.mjs`, passing `{outDir, options}` as a JSON argv. In that plain
process, native `import()` just works.

```
index.ts (CJS, under jiti)
  └─ postBuild → execFile(process.execPath, ["pagefindWorker.mjs", JSON])
       └─ pagefindWorker.mts (real ESM via .mts + module:nodenext)
            └─ runPagefind.ts → import('pagefind') → createIndex → addHTMLFile (per file) → writeFiles
```

`runPagefind` takes an injectable `load` parameter so unit tests supply a fake
instead of loading the real ESM package. **Do not try to `import('pagefind')`
directly from plugin code** — full ESM-only migration was attempted and abandoned
for this reason.

### Client-side — the swizzleable theme (browser, ESM/bundler)

`src/theme/SearchBar/` renders the search UI:

- `index.tsx` — the DocSearch modal component.
- `PagefindClient.ts` — wraps Pagefind in an **Algolia-compatible search shape**,
  so the DocSearch UI consumes it unmodified.
- `transformHits.ts` — maps Pagefind results to DocSearch hit objects.

The client loads `<baseUrl>pagefind/pagefind.js` — a runtime asset generated at
build time, not a bundleable module. `index.tsx` builds the URL at runtime with
`useBaseUrl('/pagefind/pagefind.js')` and hands it to `createPagefindSearch`, which
loads it with `import(/* webpackIgnore: true */ url)` (see below).

## Key constraints

### Theme path semantics (critical)

- `getThemePath()` returns `dist/theme/` — compiled JS, consumed by webpack for rendering.
- `getTypeScriptThemePath()` returns `src/theme/` — TypeScript source, used for `swizzle`
  only, NOT processed by webpack.
- Both paths must exist in the published package: `"files": ["dist", "src/theme"]`.

### Loading pagefind.js: runtime URL + `webpackIgnore`

- The URL is computed in the browser from `baseUrl`, never baked into the bundle. An
  earlier design substituted it through `configureWebpack` externals; Rspack (the
  Docusaurus v4 default) caches the externals resolution and its cache key ignores
  `baseUrl`, so a rebuild with a different `baseUrl` from an unchanged config file
  shipped a stale URL. Nothing baseUrl-dependent should go into the bundler config.
- `import(/* webpackIgnore: true */ url)` keeps the bundler away from the request.
  The client compile (Babel in v3, SWC in v4) preserves the comment.
- Docusaurus v3's **server** Babel preset rewrites `import()` into
  `Promise.resolve(url).then(s => require(s))`, detaching the comment, so webpack warns
  "Critical dependency: the request of a dependency is an expression". The loader never
  runs during SSR, so `configureWebpack` silences exactly that warning for
  `PagefindClient.js` on the server (`ignoreWarnings`). Drop it with v3 support.
- Rejected alternatives: `new Function('u', 'return import(u)')` needs CSP
  `unsafe-eval`; an inline `<script>` global needs an extra inline script.

### No `@docusaurus/utils`

- `runPagefind.ts` uses `fast-glob` instead of `Globby` from `@docusaurus/utils`.
- `@docusaurus/utils` is an internal Docusaurus package; its API changes without notice.

### `configureWebpack` signature

- Docusaurus v4 kept the positional `configureWebpack(config, isServer, utils, content)`
  signature and the hook is not deprecated (what v4 deprecates is the Webpack *bundler*).

## Invariants worth knowing

- **`excludeSelectors` is additive** (`options.ts` → `resolveOptions`): the curated
  `DEFAULT_EXCLUDE_SELECTORS` (Docusaurus chrome) are always kept and user selectors are
  unioned on top, so a custom list never silently drops the chrome exclusions.
- **`excludeGlobs` filters files; it does not mark them** (`runPagefind.ts`): excluded
  files are never passed to `addHTMLFile`. Marking them with
  `data-pagefind-ignore="all"` on `<body>` does not work, because `rootSelector`
  (e.g. `main`) makes Pagefind scan only that subtree, so a marker on the ancestor
  `<body>` is never seen and the page stays searchable (fixed in 0.2.0).

## Build detail

`pnpm build` runs tsc twice — `tsconfig.json` (`module: nodenext`, excludes `src/theme/**`)
for the plugin, then `tsconfig.theme.json` (esnext/bundler) for the theme — then copies
`styles.css` into `dist/`. The two tsconfigs exist because the plugin and the theme target
different module systems; this is also why `pnpm typecheck` does not cover the theme.
