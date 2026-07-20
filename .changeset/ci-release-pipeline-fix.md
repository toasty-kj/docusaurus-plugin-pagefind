---
"docusaurus-plugin-pagefind": patch
---

No functional package changes. Bumping to exercise the release pipeline
fix (running `changeset tag` after publish so `changesets/action` can
detect a successful publish) and unblock the wiki demo deploy, which has
been silently skipped since the last two releases.
