---
"docusaurus-plugin-pagefind": patch
---

Run the pagefind indexing step in a plain Node child process
(`pagefindWorker.mjs`) and remove the `new Function` dynamic-import hack.
Docusaurus loads plugins through jiti, whose CJS sandbox cannot natively
`import()` the ESM-only `pagefind` package; a spawned Node process can. No
public API changes.
