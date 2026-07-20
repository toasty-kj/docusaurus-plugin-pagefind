---
"docusaurus-plugin-pagefind": patch
---

No functional package changes. Fixes the release pipeline so a publish is
actually detected: the publish command now runs through a package.json
script (`ci:publish`) so the `&& changeset tag` chain executes in a shell
and emits the `New tag:` line that `changesets/action` parses. This
restores the `published` output, git tags, GitHub Releases, and the wiki
demo deploy, all of which had been silently skipped.
