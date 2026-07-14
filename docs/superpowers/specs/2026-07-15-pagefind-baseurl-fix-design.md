# Fix: Pagefind search silently returns no results under a non-root `baseUrl`

## Problem

Search is completely non-functional on any site deployed with a non-root
Docusaurus `baseUrl` (e.g. a GitHub Pages project site such as
`https://user.github.io/repo-name/`). Verified by building and serving the
`apps/wiki` demo (which sets `baseUrl: '/docusaurus-plugin-pagefind/'`) and
searching for "installation" — a page that exists — which returned "No
results".

### Root cause

The Pagefind runtime is fetched via a hardcoded, root-relative path,
`/pagefind/pagefind.js`, in three places:

- `PagefindClient.ts` — `import('/pagefind/pagefind.js')`
- `index.ts` — webpack `externals` matcher, exact string match on
  `/pagefind/pagefind.js`
- `SearchBar/index.tsx` — `<link rel="preconnect" href="/pagefind/" />`

When the site's `baseUrl` isn't `/`, the real index lives at
`${baseUrl}pagefind/pagefind.js`, but the client requests `/pagefind/pagefind.js`
from the domain root. The server responds with a redirect to the site's
homepage; the dynamic `import()` fails to parse HTML as a module;
`loadPagefind()` catches the error and resolves to `null`; every search then
silently returns zero hits with no visible error.

Root-baseUrl sites never hit this, which is why it went unnoticed until the
`apps/wiki` demo was recently pointed at GitHub Pages
(`de71b88 feat: deploy wiki demo to GitHub Pages on release`).

### Secondary issue

`runPagefind.ts` lets a user redirect where the index is written via the
`outputPath` option (`resolveOutputPath`), but the runtime fetch path is
hardcoded regardless of `outputPath`. A custom `outputPath` breaks search the
same way, independent of `baseUrl`.

## Fix design

### 1. Load the runtime module the same way `runPagefind.ts` already does

`runPagefind.ts` hides `import('pagefind')` inside
`new Function('specifier', 'return import(specifier)')` specifically so
webpack/tsc never sees or touches it. Apply the identical technique in
`PagefindClient.ts`'s `defaultLoader`. Because the specifier lives inside a
`Function` body string, webpack's static analysis never parses it as an
`import()` call, so it is never bundled, downleveled, or subject to
`webpackIgnore` comment survival (which the existing code comments flag as
unreliable in this build pipeline). The specifier can be a fully dynamic
string computed at runtime.

This removes the need for `index.ts`'s `configureWebpack()` / `externals`
matcher entirely — delete it.

### 2. Get `baseUrl` and the index subdirectory to the client via Docusaurus's own APIs

- **`baseUrl`**: `SearchBar/index.tsx` is a React component; call the
  standard `useDocusaurusContext()` hook and read `siteConfig.baseUrl`
  directly.
- **Index subdirectory** (normally `pagefind`, but shifts when `outputPath`
  is customized): computed once, Node-side, in `index.ts`, and exposed to
  the client via `contentLoaded({actions}) { actions.setGlobalData(...) }`,
  read back client-side with `usePluginData('docusaurus-plugin-pagefind')`.

`SearchBar/index.tsx` combines both into the real URL
(`${baseUrl}${pagefindDir}/pagefind.js`, slash-normalized) and passes it into
`createPagefindSearch(pagefindJsUrl)` → `loadPagefind(pagefindJsUrl)` →
`defaultLoader(pagefindJsUrl)`.

### 3. `outputPath` handling

In `index.ts`, compute `path.relative(outDir, resolveOutputPath(outDir, options))`:

- If the result stays inside `outDir` (the common case, including the
  default), use it as `pagefindDir` in the global data.
- If a custom `outputPath` escapes `outDir` entirely, the plugin cannot
  derive a browser-fetchable URL from it. Emit a `postBuild` console
  warning stating that search may not auto-locate the index in this case,
  rather than failing silently as today. `pagefindDir` still falls back to
  the default relative guess (`pagefind`) so behavior degrades no worse
  than before.

### 4. Cleanup

Remove `<link rel="preconnect" href="/pagefind/" />` from
`SearchBar/index.tsx`. It targets a same-origin resource, so `preconnect`
(meant for cross-origin connection warm-up) provides no benefit; not worth
threading a baseUrl-aware fix through it.

### 5. Tests

- Unit tests for the new pure "resolve pagefind subdirectory from
  `outDir`/`outputPath`" function, covering: no `outputPath` (default),
  `outputPath` inside `outDir`, `outputPath` outside `outDir`.
- First real test in the currently-empty `e2e/tests/` Playwright scaffold:
  build and serve `apps/wiki` (already configured with a non-root
  `baseUrl`), open the search modal, type a query for content known to
  exist, and assert a real result renders. This is the regression test that
  would have caught the bug fixed here.

## Out of scope

- Changing `outputPath`'s filesystem semantics (it continues to accept an
  absolute path outside `outDir`, unchanged from today).
- Any fix to `preconnect` beyond removing it.
