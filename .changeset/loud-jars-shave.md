---
"docusaurus-plugin-pagefind": patch
---

Update dependencies to pull in security fixes for transitive packages (brace-expansion, js-yaml, nanoid, postcss) and raise the declared floors to the versions actually installed: `@docsearch/css`/`@docsearch/react` ^3.9.0 and `fast-glob` ^3.3.3. The advisories affect build-time tooling only; the published runtime is unchanged.
