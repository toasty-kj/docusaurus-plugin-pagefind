# E2E tests

End-to-end regression tests that build a real Docusaurus site with this plugin
and drive its search UI in a browser. They exist because the bugs this plugin
hits most (a wrong `pagefind.js` URL under a non-root `baseUrl`, an HTML MIME
type on the runtime import) are invisible to unit tests — they only show up in a
built, served site.

## Running

```sh
pnpm test:e2e        # build fixtures, then run headless
pnpm test:e2e:ui     # same, in Playwright UI mode
```

Both go through `pnpm e2e:prepare`, which builds the plugin and then builds
every fixture variant into `e2e/.builds/<variant>` (gitignored).

## Layout

| Path                             | Role                                                       |
| -------------------------------- | ---------------------------------------------------------- |
| `fixtures/variants.ts`           | Single source of truth for the variant matrix               |
| `fixtures/site/`                 | The Docusaurus site under test (`@fixtures/site`)           |
| `scripts/build-fixtures.mts`     | Builds each variant sequentially, before Playwright starts  |
| `playwright.config.ts`           | Derives projects + webServers from `variants.ts`            |
| `tests/`                         | Specs — each runs once per variant                          |

## The variant matrix

`fixtures/variants.ts` defines each variant's `name`, `baseUrl`, `port`, and
`pluginOptions`. Everything else is derived from it: the build script, one
Playwright project per variant, and one `webServer` per variant. Adding a
variant means adding an entry there — nothing else needs editing.

The fixture site reads `FIXTURE_VARIANT` from the environment and looks itself
up via `getVariant()`, so a single site directory covers every configuration.

Current variants:

- `root-baseurl` — `baseUrl: '/'`, port 3100
- `non-root-baseurl` — `baseUrl: '/fixture-base/'`, port 3101

## Why builds are serialized outside Playwright

Fixtures are built by `scripts/build-fixtures.mts` *before* `playwright test`
runs, not in `globalSetup` or in the `webServer` commands. Playwright starts
webServers in parallel and before `globalSetup`, and concurrent
`docusaurus build` runs against the same site directory race on the shared
`.docusaurus/` dir and webpack cache. The `webServer` entries only *serve*
output that already exists.

Serving goes through `docusaurus serve` rather than a plain static server
because it honours the site's `baseUrl` and returns the correct JavaScript MIME
type — a naive static server gets the latter wrong, which is the exact failure
mode the original bug produced.

## Writing specs

Specs get the variant's origin *and* `baseUrl` through Playwright's `baseURL`,
so they need no knowledge of which variant they're running under. Use relative
paths:

```ts
await page.goto('./') // '/' would drop a non-root baseUrl
```
