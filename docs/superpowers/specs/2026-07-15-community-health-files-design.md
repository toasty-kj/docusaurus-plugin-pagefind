# Community Health Files & README Polish — Design

Date: 2026-07-15
Status: Approved

## Background

`docusaurus-plugin-pagefind` is already published on npm (v0.1.1) with a working
CI/release pipeline (Changesets + npm Trusted Publishing) and a git-flow branching
model. As part of preparing the project for wider OSS visibility, this is the first
of several planned sub-projects to raise the repo's trust/polish level. It covers
README readability and the standard GitHub community health files. Two further
sub-projects — E2E test coverage and outreach/marketing — are deliberately out of
scope here and will get their own specs later.

## Goals

- Make the README look like a maintained, usable project rather than a
  work-in-progress (remove the 🚧 marker, add status badges, link the live demo).
- Add the standard GitHub community health files so contributors and users know
  how to behave, how to report issues/vulnerabilities, and what's expected in a PR.
- Adjust a couple of GitHub repo settings so the demo link and Discussions are
  discoverable from the repo homepage.

## Non-goals

- Fixing the GitHub Pages deployment source (`legacy`/`develop` branch vs. the new
  `deploy-pages` Actions workflow added in `de71b88`). The user has chosen to leave
  this as-is; it should self-resolve on the next release when Changesets triggers
  `release.yml`. This is a known follow-up item, not part of this spec.
- Capturing the actual demo screenshot/GIF for the README — the user will supply
  this asset themselves. This spec only adds a placeholder.
- E2E test expansion, CI/CD hardening, marketing/outreach — separate specs.

## Design

### A. `README.md`

- Remove the leading 🚧 emoji/"under construction" framing from the title.
- Add badges directly under the H1, in this order:
  1. npm version — `https://img.shields.io/npm/v/docusaurus-plugin-pagefind`
  2. npm weekly downloads — `https://img.shields.io/npm/dw/docusaurus-plugin-pagefind`
  3. CI status — GitHub Actions badge for `ci.yml` on `main`
  4. License — MIT badge
  All badges link out to their respective source (npm page, Actions run, LICENSE file).
- Immediately after the intro paragraph, add a "🔗 Live Demo" link pointing to
  `https://toasty-kj.github.io/docusaurus-plugin-pagefind/` (current Pages URL,
  left as-is per Non-goals).
- Below the demo link, add an HTML comment + image placeholder for the search
  modal GIF, e.g.:
  ```md
  <!-- TODO(cozytakaki): replace with a real GIF of the search modal in action -->
  ![demo placeholder](./docs/demo-placeholder.png)
  ```
  No actual image asset is created by this spec — the placeholder path is a
  marker for the user to fill in later.
- Add a "Community" section near the bottom, linking to `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, and `SECURITY.md`.

### B. `CODE_OF_CONDUCT.md` (new, repo root)

- Standard Contributor Covenant v2.1 text.
- Reporting contact: GitHub username-based private contact (e.g., "contact
  @toasty-kj via a private message, or use GitHub's built-in
  [Report abuse](https://github.com/contact/report-abuse) flow"). No email address
  is published.

### C. `SECURITY.md` (new, repo root)

- Directs vulnerability reports to GitHub Security Advisories ("Report a
  vulnerability" under the repo's Security tab) rather than email.
- Brief supported-versions note: only the latest published `0.x` release is
  supported (pre-1.0, no LTS policy yet).

### D. Issue templates (new, `.github/ISSUE_TEMPLATE/`)

- `bug_report.yml` — GitHub issue form with fields: Docusaurus version, plugin
  version, pagefind version, reproduction steps, expected behavior, actual
  behavior, relevant logs/config.
- `feature_request.yml` — issue form with fields: problem/motivation, proposed
  solution, alternatives considered.
- `config.yml` — `blank_issues_enabled: false`, with a contact link pointing to
  GitHub Discussions for general questions.

### E. Pull request template (new, `.github/PULL_REQUEST_TEMPLATE.md`)

- Lightweight checklist: description of the change, linked issue (if any),
  confirmation that a changeset was added (`pnpm changeset`), confirmation that
  tests were added/updated.

### F. GitHub repository settings (via `gh` CLI, executed with user confirmation)

- Set the repo Homepage URL to the demo link (same URL as the README's Live Demo
  link).
- Enable GitHub Discussions.

## Testing / Verification

This is a docs/config-only change — no application code is touched. Verification
is manual:

- Render `README.md` locally (or on GitHub after push) and confirm badges resolve
  and links are correct.
- Confirm new issue forms render correctly by previewing them on GitHub
  ("Preview" tab in a draft issue) or via `gh issue create` dry-run inspection.
- Confirm `gh repo view` reflects the updated homepage URL and Discussions status
  after the settings change is applied.

## Rollout

All file changes (README, CODE_OF_CONDUCT, SECURITY, issue/PR templates) are
plain commits on a feature branch off `develop`, per this repo's existing
git-flow contribution model (see `CONTRIBUTING.md`). The GitHub settings changes
(Homepage URL, Discussions) are applied directly via `gh` once the user confirms,
independent of the PR/merge flow.
