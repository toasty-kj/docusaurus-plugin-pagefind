# References

Local, curated copies of the external APIs this plugin depends on, in plain-text
`*-llms.txt` form. The goal (per [`../harness-engineering.md`](../harness-engineering.md))
is to make the repo the system of record: an agent can reason about the code
without leaving the repo to search the web.

These are **scoped to what this plugin actually calls**, not full API dumps —
smaller is the point. Each file names its upstream source of truth; verify there
if something looks stale.

| File | Covers | Used by |
|---|---|---|
| [`pagefind-node-api-llms.txt`](./pagefind-node-api-llms.txt) | Pagefind Node indexing API (`createIndex`, `addDirectory`, `writeFiles`, `close`) | `src/runPagefind.ts` |
| [`docusaurus-plugin-api-llms.txt`](./docusaurus-plugin-api-llms.txt) | Docusaurus plugin lifecycle (`postBuild`, `configureWebpack`, `getThemePath`, `getTypeScriptThemePath`) | `src/index.ts` |

When the plugin starts calling a new part of either API, extend the relevant file
rather than adding a new one.
