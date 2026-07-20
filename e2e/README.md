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
| `tests/helpers.ts`               | Shared search helpers (not a spec — no project matches it)  |
| `tests/shared/`                  | Specs true under every build                                |
| `tests/no-options/`              | Specs true only when no plugin options are set              |
| `tests/options/`                 | Specs true only for the combined-options build              |

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
- `options-combined` — `baseUrl: '/'`, port 3102, all four plugin options set

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

## Tiers: which specs run where

Each variant declares the tiers it runs (`Variant.tiers`), and
`playwright.config.ts` turns those into the project's `testMatch`. **Splitting
specs into directories does nothing on its own** — Playwright projects are a
cross product with specs, so without `testMatch` every variant would run every
spec. The directory split and `testMatch` only work as a pair.

Because a spec runs only where its expectations hold, expectations are
hardcoded. **No spec should branch on `test.info().project.name`.** If you find
yourself wanting to, the spec is in the wrong tier — split it.

Choosing a tier comes down to one question: *under which builds is this
assertion true?*

- True everywhere → `tests/shared/`
- True only without plugin options → `tests/no-options/`
- True only for the combined-options build → `tests/options/`

`tests/no-options/` is the positive half of the exclusion pairs in
`tests/options/`. Every "this token is absent" assertion needs a matching "this
token is present" assertion in `no-options/`, or it would pass just as well if
the token had never been indexable.

The suite runs 44 executions off three builds. Total executions are deliberately
*not* minimised: the three serialized `docusaurus build` runs dominate the
runtime and are fixed, while browser assertions are cheap and run in parallel —
so `tests/shared/` runs on all three variants rather than being gated to one.

## Writing specs

Specs get the variant's origin *and* `baseUrl` through Playwright's `baseURL`,
so they need no knowledge of which variant they're running under. Use relative
paths:

```ts
await page.goto('./') // '/' would drop a non-root baseUrl
```

Prefer the helpers in `tests/helpers.ts` over hand-rolled modal interaction.
`expectNoHits` in particular runs a positive control search first, so a zero
result count means "excluded from the index" rather than "the index never
loaded".

Fixture search tokens follow a `zz<name>token` convention and must be unique
across the site.
