---
"docusaurus-plugin-pagefind": patch
---

Remove the `@iconify/react` runtime dependency from the search bar theme. The two hit-type icons (hashtag / document) are now inline SVGs, avoiding a runtime fetch to the Iconify API for what were two fixed icons.
