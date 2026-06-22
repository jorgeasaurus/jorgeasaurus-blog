# Publish Dev Changes

- [x] Inspect local diff and branch state.
- [x] Verify GitHub and Vercel CLI access.
- [x] Run final checks before publishing.
- [x] Commit scoped changes on `dev`.
- [x] Push `dev` to `origin`.
- [x] Create Vercel preview deployment.
- [x] Open PR from `dev` to `main`.

## Review

Pushed `dev` to `origin`, deployed Vercel preview at `https://jorgeasaurus-blog-m7obvc8b5-jorgeasaurus-projects.vercel.app`, and opened PR `https://github.com/jorgeasaurus/jorgeasaurus-blog/pull/4`.

# PR Review Follow-up

- [x] Fetch unresolved PR review threads.
- [x] Patch actionable CSS comments.
- [x] Update PR title/summary for content scope.
- [x] Run available verification checks.

## Review

Removed the duplicate card-date color, restored expandable-image hover affordance in inline figures, and updated PR metadata for the content scope. `npm run lint`, `npm run build`, and `git diff --check` passed; React Doctor was unavailable because `react-doctor` is not installed or cached locally and network escalation for `npx react-doctor@latest` was rejected.

# Merge PR 4 Prep

- [x] Reconcile `dev` with current `main`.
- [x] Run verification checks.

## Review

Resolved the `src/styles/App.css` conflict by keeping the PR review fix that preserves expandable-image hover affordance. `npm run lint`, `npm run build`, and `git diff --check` passed.

# Complete New Post

- [x] Identify missing new-post metadata/assets.
- [x] Add post social-card asset and metadata.
- [x] Regenerate RSS/build artifacts through normal build.
- [x] Verify new post with lint/build and metadata checks.

## Review

Added the new post social card, wired `socialImage` metadata, regenerated RSS through `npm run build`, and verified generated post metadata.

# Refine New Post Social Card

- [x] Compare the new social card with the reference card.
- [x] Regenerate the new card in the reference visual style.
- [x] Verify dimensions and generated metadata still match.

## Review

Regenerated the new post social card with the foggy forest background, glass panel, large title treatment, terminal/device illustration, and bottom tag/icon row matching the reference style. Verified the 1200x630 asset, generated metadata, lint, build, and diff whitespace check.

# Create Glass UI Skill

- [x] Extract the concrete glass UI patterns from the current page.
- [x] Create a reusable agent skill for building pages in this style.
- [x] Install the skill where agents can discover it.
- [x] Validate the skill structure and summarize usage.

## Review

Created `jorgeasaurus-glass-ui` in `/Users/jorgeasaurus/.agents/skills` with `SKILL.md` guidance and `agents/openai.yaml` UI metadata. Validated installed YAML/frontmatter with Ruby because the bundled validator requires unavailable `PyYAML`.

# Create Make Yourself Obsolete Post

- [x] Inspect existing post structure and style references.
- [x] Add the MDX post using the blog voice guide.
- [x] Register post metadata and social image.
- [x] Create a 1200x630 social card asset.
- [x] Run lint/build and inspect generated metadata.

## Review

Created `make-yourself-obsolete` with metadata, RSS output, and a 1200x630 social card. Verified `npm run lint`, `npm run build`, `git diff --check`, generated social metadata, RSS entry, and local route render at `/make-yourself-obsolete`.

# Match Make Yourself Obsolete Content Card

- [x] Compare the current card against the Intune Gotchas reference.
- [x] Regenerate the card in the Intune Gotchas card style.
- [x] Verify dimensions, metadata, and build output.

## Review

Regenerated `make-yourself-obsolete` social card to match the Intune Gotchas layout and visual language. Verified 1200x630 PNG dimensions, generated `og:image` and `twitter:image` metadata, `npm run lint`, `npm run build`, and `git diff --check`.

# Merge Make Yourself Obsolete Into Main

- [x] Inspect branch state and pending changes.
- [x] Commit scoped post changes on `dev`.
- [x] Update local `main` from `origin/main`.
- [x] Merge `dev` into `main`.
- [x] Run verification on `main`.
- [x] Push `main` to `origin`.

## Review

Merged `dev` into `main` and pushed `main` to `origin` at `7005ef1`. Verified `npm run lint`, `npm run build`, `git diff --check`, RSS entry, and generated social metadata for `/make-yourself-obsolete`. Left the unrelated `.gitignore` change unstaged.

# Install Global Skills

- [x] Inventory local skill directories.
- [x] Sync `/Users/jorgeasaurus/Code/agent-skills` into `~/.codex/skills`.
- [x] Verify every source skill has a global `SKILL.md`.

## Review

Installed all 54 source skills globally. Verification found no missing source skills under `~/.codex/skills`; the global directory now has 58 total skills including existing global-only entries.

# Debug Hook Failures

- [x] Review current lessons and locate hook configuration.
- [x] Reproduce `PreToolUse` and `SessionStart` hook failures.
- [x] Identify the root cause and smallest durable fix.
- [x] Apply the fix.
- [x] Verify hooks no longer fail.

## Review

Updated global Codex/Claude Python hook commands from `python` to `python3`. Patched both installed Vercel Codex plugin hook manifests to use absolute hook script paths instead of unresolved `CODEX_PLUGIN_ROOT`. Verified JSON parsing, representative PreToolUse guard execution, and all three Vercel SessionStart hook commands.

# Add Projects Page

- [x] Review current page, nav, and sitemap patterns.
- [x] Add `/projects` route and project page content.
- [x] Style the page responsively in the existing glass UI.
- [x] Add `/projects` to generated sitemap output.
- [x] Verify lint, build, and local render.

## Review

Added `/projects` with 2 live apps and 17 repositories, wired the top nav and sitemap generator, and verified desktop/mobile render with Playwright against local Chrome. `npm run lint`, `npm run build`, `git diff --check`, sitemap output, and overflow/card-count checks passed.

# Deploy Projects Preview

- [x] Confirm Vercel project link and local status.
- [x] Fix `/projects` static HTML output.
- [x] Create Vercel preview deployment.
- [x] Record preview URL and result.

## Review

Deployed corrected preview at `https://jorgeasaurus-blog-ewk8xpc29-jorgeasaurus-projects.vercel.app`. Verified deployment status `Ready` with `vercel inspect` and verified `/projects` returns the Projects static HTML with `vercel curl`. `npm run lint`, `npm run build`, and `git diff --check` passed.

# Projects Page Link Cleanup

- [x] Point Graph Explorer Plus, MgGraphIndex, and NukeTune cards at their public sites.
- [x] Remove the hero stats block.
- [x] Verify lint, build, and diff whitespace.
- [x] Deploy updated Vercel preview.

## Review

Updated Graph Explorer Plus, MgGraphIndex, and NukeTune to use their public site URLs and removed the hero stats panel. Verified `npm run lint`, `npm run build`, `git diff --check`, desktop/mobile Playwright render checks, and Vercel preview `https://jorgeasaurus-blog-5yo2asp6j-jorgeasaurus-projects.vercel.app`.

# Win32Forge Project Link Fix

- [x] Point Win32Forge at its public site.
- [x] Verify lint, build, and diff whitespace.
- [x] Deploy updated Vercel preview.

## Review

Updated Win32Forge to link to `https://jorgeasaurus.github.io/Win32Forge/` and changed its CTA to `Visit site`. Verified `npm run lint`, `npm run build`, `git diff --check`, Vercel preview `Ready`, and `/projects` static HTML on `https://jorgeasaurus-blog-fjw0hmim2-jorgeasaurus-projects.vercel.app`.

# Promote Live Project Cards

- [x] Move Graph Explorer Plus, NukeTune, and Intune Gazette into Live projects.
- [x] Point Intune Gazette at its GitHub Pages site.
- [x] Verify lint, build, and rendered project grouping.
- [x] Deploy updated Vercel preview.

## Review

Moved Graph Explorer Plus, NukeTune, and Intune Gazette into the Live projects section. Intune Gazette now points to `https://jorgeasaurus.github.io/IntuneDocsAutomation/`. Verified lint, build, desktop/mobile rendered grouping, Vercel `Ready`, and `/projects` static HTML on `https://jorgeasaurus-blog-l2hi544ux-jorgeasaurus-projects.vercel.app`.

# Publish Projects Page

- [x] Run final local verification.
- [ ] Commit projects page changes on `main`.
- [ ] Push `main` to `origin`.
- [ ] Deploy Vercel production.
- [ ] Verify production `/projects`.
