---
"docusaurus-plugin-pagefind": patch
---

Keep the highlighted query term visible in the selected hit under CSS cascade layers (on by default in Docusaurus v4). `@docsearch/css` forces that color with a layered `!important`, which beat the plugin's unlayered `!important` and rendered the term white on a near-white row.
