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
- [x] Commit projects page changes on `main`.
- [x] Push `main` to `origin`.
- [x] Deploy Vercel production.
- [x] Verify production `/projects`.

## Review

Committed projects page changes on `main` at `833e1cc` and pushed to `origin/main`. Deployed production at `https://jorgeasaurus-blog-8ov326601-jorgeasaurus-projects.vercel.app`, aliased to `https://jorgeasaur.us` and `https://www.jorgeasaur.us`. Verified Vercel production status `Ready` and `/projects` static HTML with `vercel curl`.

# Apply Liquid Glass Styling To Blog

- [x] Reset the mistaken agency landing-page replacement.
- [x] Keep the existing blog app, routes, content, and brand identity intact.
- [x] Apply prompt-inspired liquid-glass styling to existing blog surfaces.
- [x] Verify lint, build, whitespace, and responsive render.
- [x] Deploy and verify a Vercel preview.

## Review

Preserved the existing blog app and applied only the liquid-glass styling to current blog surfaces. Verified lint, build, whitespace, local desktop/mobile render, and protected Vercel preview render.

Preview: `https://jorgeasaurus-blog-bhuuzz6vq-jorgeasaurus-projects.vercel.app`
Share URL: `https://jorgeasaurus-blog-bhuuzz6vq-jorgeasaurus-projects.vercel.app/?_vercel_share=rjNb4c7IkvAge0iY1EQL82b3MCnLqH2u`

# Publish Liquid Glass Styling

- [x] Confirm branch state and final diff.
- [x] Run final verification before merging.
- [x] Commit the scoped branch changes.
- [x] Merge into `main` and push to `origin`.
- [x] Deploy Vercel production and verify the live site.

## Review

Pushed the liquid-glass styling to `main`, deployed Vercel production, and verified `https://www.jorgeasaur.us` renders the existing blog with no agency-page copy and no desktop/mobile horizontal overflow.

# Add Tenant Graph Project

- [x] Inspect the existing projects page structure and Tenant Graph metadata.
- [x] Add Tenant Graph to the live projects section.
- [x] Verify lint, build, and rendered project grouping.

## Review

Added Tenant Graph to Live projects with the public site URL and metadata-aligned description. Verified lint, build, whitespace, and local `/projects` render with Tenant Graph in the featured grid.

# Deploy Tenant Graph Preview

- [x] Confirm current diff is scoped.
- [x] Create Vercel preview deployment.
- [x] Verify preview status and `/projects` render.

## Review

Deployed Vercel preview `dpl_CaNeXzNF6Y1XqbaezFtGfxJFGEYt` and verified `/projects` renders Tenant Graph in the featured grid.

Preview: `https://jorgeasaurus-blog-sy9l9dbuh-jorgeasaurus-projects.vercel.app`
Share URL: `https://jorgeasaurus-blog-sy9l9dbuh-jorgeasaurus-projects.vercel.app/?_vercel_share=g9gqYq92FXTEXUJJHN8aUdar8WLczPxh`
# Main Hero Placement

- [x] Switch back to `main` and preserve branch work.
- [x] Adjust homepage hero placement to match the supplied reference.
- [x] Verify lint, build, screenshots, and responsive layout.

## Review

Switched to `main`, preserved the prior Three.js branch work in a stash, restored the hero to the origin/main width, enlarged the title wordmark, and lifted the title/signal block to keep it clear of the lower-right intro.

Verified `npm run lint`, `npx tsc -b --pretty false`, `git diff --check`, `npm run build`, and Playwright desktop/tablet/mobile screenshots plus overflow checks.

# Project Card Blur Match

- [x] Compare project-card and project-hero glass blur values.
- [x] Match project-card backdrop filtering to the project hero.
- [x] Verify lint, build, and `/projects` screenshots.

## Review

Superseded by the shared hero blur pass below; project cards now keep the darker forest tint and inner glass overlay while using the same blur filter as the main hero.

Verified again in the shared hero blur pass below.

# Shared Hero Blur

- [x] Replace per-surface blur radii with the main hero blur filter token.
- [x] Verify lint, build, and desktop/mobile screenshots.

## Review

Added `--main-hero-glass-filter` and routed the hero, topbar, post cards, project cards, social card panel, and image lightbox through the same `blur(22px) saturate(1.12) brightness(0.84)` filter.

Verified `npm run lint`, `npx tsc -b --pretty false`, `git diff --check`, `npm run build`, and Playwright desktop/mobile screenshots for `/` and `/projects` with no horizontal overflow or WebGL warnings.

# Project/Post Card Style Alignment

- [x] Compare post-card and project-card style differences.
- [x] Move project cards onto the post-card glass surface recipe.
- [x] Verify lint, build, and `/projects` screenshots.

## Review

Moved project cards onto the same visible card recipe as post cards: liquid-card background stack, shared blur filter, matching rim strength, glint line, shadow, tag chips, and text CTA. Project-specific dimensions and title sizing remain separate.

Verified `npm run lint`, `npx tsc -b --pretty false`, `git diff --check`, `npm run build`, and Playwright desktop/mobile screenshots for `/` and `/projects` with matching computed card styles, no horizontal overflow, and no WebGL warnings.

# Ponytail Card CSS Simplification

- [x] Review current diff for over-engineered duplicated card CSS.
- [x] Group shared post/project card selectors.
- [x] Verify lint, build, and Playwright screenshots.

## Review

Grouped duplicated post/project card CSS into shared selectors for the card shell, rim, glint, featured spacing, title/meta/description, tags, and CTA while keeping project-specific sizing separate.

Verified `npm run lint`, `npx tsc -b --pretty false`, `git diff --check`, `npm run build`, and Playwright desktop/mobile screenshots for `/` and `/projects`. Playwright computed-style checks matched featured and regular post/project cards on background, blur, radius, rim, glint, tags, and CTA with no horizontal overflow or console errors.

# Feature User Story Audit

- [x] Inspect current routes, pages, components, content data, and build scripts.
- [x] Create the canonical feature-status spreadsheet with user stories and expected behavior.
- [x] Verify the spreadsheet opens, renders legibly, and has no formula errors.
- [x] Start the user-story testing loop and document errors in the spreadsheet.
- [x] Fix verified logistical or UX errors.
- [x] Retest every user behavior after fixes.

## Review

Created `tasks/feature-status.xlsx` as the single canonical tracker. It contains code-derived user stories, expected behavior, source evidence, status columns, test/fix/retest fields, summary formulas, issue log, source inventory, post catalog, and project catalog.

Verified all workbook sheets render legibly from the spreadsheet runtime, re-imported the saved `.xlsx`, confirmed six sheets are present, sampled the User Stories and Issue Log tables, and found zero formula-error matches.

Expanded the tracker to 40 user stories after auditing MDX content behavior. The first testing loop found one logistical issue: `src/content/hello-world.mdx` existed without a matching `posts.ts` metadata entry, making it unreachable from the list, routes, RSS, sitemap, and static HTML generation. Registered the existing post metadata without rewriting the content.

Verified `npm run lint`, `npx tsc -b --pretty false`, `git diff --check`, `npm run build`, a 40-story Playwright sweep, and a post-fix 40-story Playwright retest. The canonical workbook now shows 40 total user stories and 40 `Retest Passed` rows with no formula errors.

# Main Production Push

- [x] Run final verification before commit.
- [x] Commit current app and audit changes on `main`.
- [x] Push `main` to origin.
- [x] Deploy production on Vercel and verify.

## Review

Committed the glass/card polish, restored `hello-world` post coverage, pushed `main`, and deployed production on Vercel.

Verified production deployment `dpl_7dufbCvowF9ACXebmZxz2WvNg4a9` is Ready, aliased to `https://www.jorgeasaur.us`, serves the homepage, includes `/hello-world` article metadata, and includes `hello-world` in RSS and sitemap.
