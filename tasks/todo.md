# Apply Adversarial Review Edits

- [x] Revise the critical-path, security, and convergence model.
- [x] Correct targeting, reboot, packaging, reporting, and scenario claims.
- [x] Run a focused adversarial verification pass.
- [x] Run lint, build, metadata, and browser checks.

## Review

Revised the post to distinguish installed payload from verified readiness, model cumulative serialized cost, require post-OOBE convergence controls, document reporting limits, and correct scenario/context claims. Adversarial re-review found no material gaps; links, lint, build, metadata, and browser checks passed.

# Adversarial Review: Autopilot Device Preparation Post

- [x] Classify the post's core claims.
- [x] Verify current technical claims against primary sources.
- [x] Stress-test the recommendations against operational counterexamples.
- [x] Report ranked findings with line references and proposed corrections.

## Review

The critical-path thesis holds, but the post overstates secure-at-desktop guarantees, models serialized work as a single slowest item, and asks readers to derive measurements the built-in report does not expose. No post edits were made.

# Write Autopilot Device Preparation Provisioning Post

- [x] Inspect repository post conventions and relevant lessons.
- [x] Research current Microsoft guidance and credible field evidence.
- [x] Draft and register the MDX post.
- [x] Create and register a 1200x630 social card.
- [x] Verify claims, links, lint, build, metadata, and rendered route.

## Review

Added the Autopilot device preparation performance post, metadata, RSS/sitemap entries, and social card. Verified all cited links, lint, production build, generated social metadata, and the rendered route in Chrome.

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

# Write Idempotent PowerShell Post

- [x] Draft the MDX post in the existing blog style.
- [x] Register post metadata and social image.
- [x] Create a 1200x630 social card.
- [x] Validate PowerShell snippets and site build.
- [x] Record review results.

## Review

Created `write-idempotent-powershell-scripts` with metadata, RSS/sitemap output, and a 1200x630 social card. Verified 8 PowerShell snippets parse, `npm run lint`, `npm run build`, `git diff --check`, generated social metadata, and local route `200 OK` at `http://127.0.0.1:4000/write-idempotent-powershell-scripts`.

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

Verified the production deployment is Ready, aliased to `https://www.jorgeasaur.us`, serves the homepage, includes `/hello-world` article metadata, and includes `hello-world` in RSS and sitemap.

# Remove Snapshot Console Noise

- [x] Trace production console output to the glass snapshot implementation.
- [x] Replace snapshot/WebGL glass activation with native CSS glass activation.
- [x] Verify lint, typecheck, build, and browser console output.
- [x] Commit, push, and deploy the production-facing fix.

## Review

Removed the vendored liquid-glass WebGL/html2canvas implementation and kept glass surfaces on native CSS backdrop filters. This removes the `document.write` path and the html2canvas clone/render console output from production.

Verified `npm run lint`, `npx tsc -b --pretty false`, `git diff --check`, `npm run build`, local Playwright console checks, desktop/mobile screenshots, and production Playwright console checks across `/`, `/projects`, and `/hello-world`.

# Deploy Idempotent PowerShell Post Preview

- [x] Confirm Vercel project link and local diff scope.
- [x] Create Vercel preview deployment.
- [x] Verify deployment status and new post route.
- [x] Record preview URL and result.

## Review

Deployed preview `dpl_71GtXqozxjkia9VnWiax6MWH39BR` and verified status `Ready` plus `/write-idempotent-powershell-scripts` metadata with `vercel curl`.

Preview: `https://jorgeasaurus-blog-jyiy618ls-jorgeasaurus-projects.vercel.app`
Share URL: `https://jorgeasaurus-blog-jyiy618ls-jorgeasaurus-projects.vercel.app/write-idempotent-powershell-scripts?_vercel_share=1a9THqWYgeIh5zJ8FsuaIdX6MB0WBMpH`

# Fix Idempotent PowerShell Post Logic

- [x] Tighten idempotence wording and output contract claims.
- [x] Remove ambiguous registry state reads from examples.
- [x] Fix `-WhatIf` and dry-run result semantics.
- [x] Clarify detection error and verification assumptions.
- [x] Verify snippets and site build.

## Review

Updated the post so the definition uses managed state, registry examples distinguish missing values from null values, the state object includes status, dry-run paths report skipped changes, detection errors call out the safe-remediation assumption, and the checklist verifies read-back state. Verified 8 PowerShell snippets parse, `npm run lint`, `npm run build`, generated article metadata, RSS/sitemap entries, and `git diff --check`.

# Address Final Idempotent Post Assumptions

- [x] Add concurrency caveat.
- [x] Separate `WouldChange` from `Skipped`.
- [x] Clarify `exit 2` caller contract.
- [x] Cover richer registry value comparison.
- [x] Clarify read-back verification limits.
- [x] Verify snippets and site build.

## Review

Added `Repeated Is Not Concurrent`, changed dry-run results to `WouldChange`, documented the `exit 2` caller contract, expanded registry comparison for string, expand string, binary, DWORD, multi-string, and QWORD values, and added async read-back guidance. Verified 8 PowerShell snippets parse, `npm run lint`, `npm run build`, article metadata, RSS/sitemap entries, and `git diff --check`.

# Deploy Final Idempotent Post Preview

- [x] Confirm Vercel project link and local diff scope.
- [x] Create Vercel preview deployment.
- [x] Verify deployment status and updated post route.
- [x] Record preview URL and result.

## Review

Deployed preview `dpl_D2NvhBcfqwtQjtFepzSKkF9DMBZy`, verified status `Ready`, confirmed route metadata with `vercel curl`, and confirmed the deployed post asset contains the final assumption-pass content.

Preview: `https://jorgeasaurus-blog-g2py2826r-jorgeasaurus-projects.vercel.app`
Share URL: `https://jorgeasaurus-blog-g2py2826r-jorgeasaurus-projects.vercel.app/write-idempotent-powershell-scripts?_vercel_share=jRJY181ExDuDmkplqQ2djDACg5DIRlCz`

# Newsletter Signup And Publish Emails

- [x] Inspect existing publish/build flow and choose the smallest durable email architecture.
- [x] Add a subscription API endpoint for member signups.
- [x] Add newsletter signup UI to high-intent blog surfaces.
- [x] Add a publish notification script for emailing the latest post.
- [x] Document required environment variables.
- [x] Verify lint, typecheck, build, and endpoint/script behavior.

## Review

Added Resend-backed member signup through `/api/subscribe`, homepage/article signup UI, and `npm run newsletter:latest` for dry-run, draft, or confirmed send broadcasts. Verified official Resend Contacts/Broadcasts payloads, `npm run lint`, `npx tsc -b --pretty false`, `npm run check:js`, `npm run build`, API validation paths, dry-run latest-post selection, send confirmation refusal, and desktop/mobile Playwright layout checks with local Chrome.

# Deploy Newsletter Preview

- [x] Confirm current diff and preview scope.
- [x] Run final local verification.
- [x] Create Vercel preview deployment.
- [x] Verify deployment status and key routes/API behavior.
- [x] Record preview URL and result.

## Review

Deployed preview `dpl_HNqMbXjdfT6oRf4B9EFhpySuNF1o` and verified status `Ready`, homepage HTML, new post metadata, and `/api/subscribe` invalid-email POST returning `400`.

Preview: `https://jorgeasaurus-blog-n2jlorgpn-jorgeasaurus-projects.vercel.app`
Share URL: `https://jorgeasaurus-blog-n2jlorgpn-jorgeasaurus-projects.vercel.app/?_vercel_share=z2zkKPwJnYQHXxg77M31njcpsJHQOObO`

# Move Newsletter Signup To Bottom

- [x] Move homepage signup below the post list and pagination.
- [x] Move article signup below adjacent-post navigation.
- [x] Verify layout and build.
- [x] Explain where subscriber emails are stored.

## Review

Moved the existing newsletter signup to the bottom of the homepage content flow and to the bottom of article pages after adjacent-post navigation. Verified `npm run lint`, `npx tsc -b --pretty false`, `npm run check:js`, `npm run build`, `git diff --check`, and local Chrome DOM/layout checks with no horizontal overflow.

# Add Newsletter Member Count

- [x] Verify the current Resend contacts listing API.
- [x] Add a script that counts contacts in the configured newsletter segment.
- [x] Add an npm command and include it in JS syntax checks.
- [x] Update README usage.
- [x] Verify command and build checks.

## Review

Added `npm run newsletter:count` backed by Resend `GET /contacts` filtered by `NEWSLETTER_SEGMENT_ID`, with `.env.local` loading, pagination, and total/subscribed/unsubscribed output. Verified official Resend docs, missing-env handling, help output, `npm run lint`, `npx tsc -b --pretty false`, `npm run check:js`, `npm run build`, and `git diff --check`; live count was not run because `RESEND_API_KEY` and `NEWSLETTER_SEGMENT_ID` are not present locally.

# Fix Newsletter Button Alignment

- [x] Confirm current signup form layout.
- [x] Align the notify button with the email input.
- [x] Verify lint/build and rendered layout.

## Review

Matched the newsletter input and submit button to explicit 48px control heights, centered the button contents, and preserved the stacked mobile form. Verified `npm run lint`, `npx tsc -b --pretty false`, `npm run build`, `git diff --check`, and Playwright desktop/mobile bounding boxes. Rechecked with Playwright: desktop top/bottom/height deltas are `0px`; mobile stacks with equal `306px` widths.

# Remove Idempotent PowerShell Post

- [x] Remove post metadata and source files.
- [x] Regenerate generated feed/sitemap output.
- [x] Verify build and absence of post references.

## Review

Removed `write-idempotent-powershell-scripts` from post metadata, deleted its MDX source and social-card asset folder, and regenerated RSS/sitemap via the normal build. Verified `npm run lint`, `npx tsc -b --pretty false`, `npm run check:js`, `npm run build`, `git diff --check`, no remaining source/public references, and Playwright route behavior showing `Post Not Found` without the removed title.

# Correct Newsletter Button Alignment

- [x] Move input and submit button into one controls row.
- [x] Verify screenshot-like desktop widths with Playwright.
- [x] Run project checks.

## Review

Moved the email input and `Notify me` submit button into a shared `.newsletter-signup__controls` row so their visual alignment is owned by one layout container. Verified with Playwright at 974px, 950px, 768px, and 390px widths; desktop controls share one row with top/bottom deltas at `0px` for the screenshot width, and mobile stacks at equal width. Verified `npm run lint`, `npx tsc -b --pretty false`, `npm run check:js`, `npm run build`, and `git diff --check`.

# Set Newsletter Environment Variables

- [x] Write local `.env.local` values without tracking secrets.
- [x] Add Resend newsletter variables to Vercel production, preview, and development.
- [x] Verify Resend segment access.

## Review

Set `RESEND_API_KEY`, `NEWSLETTER_SEGMENT_ID`, and `NEWSLETTER_FROM` locally and in Vercel. Verified `.env.local` is gitignored with `0600` permissions, `vercel env ls` shows all three variables in production/preview/development, and `npm run newsletter:count -- --json` authenticated successfully with zero contacts in the segment.

# Deploy Newsletter Preview

- [x] Confirm deploy scope and local status.
- [x] Run local verification checks.
- [x] Create Vercel preview deployment.
- [x] Verify preview routes and API behavior.

## Review

Deployed preview `dpl_7nBmDofwyK59MBPDoKjRHVycf4q7` from the current dirty working tree and confirmed Vercel state `READY`.

Preview: `https://jorgeasaurus-blog-d83gdrkpq-jorgeasaurus-projects.vercel.app`

Verified `npm run lint`, `npx tsc -b --pretty false`, `npm run check:js`, `npm run build`, `git diff --check`, homepage HTML via `vercel curl`, deployed newsletter CSS/JS assets, removed-post static HTML behavior, RSS without the removed idempotent post, and `/api/subscribe` invalid-email POST returning `400`.

# Add Newsletter Email Template Workflow

- [x] Extract the Resend broadcast template from the send script.
- [x] Clarify the post-publish email send flow.
- [x] Verify dry-run, syntax, lint, and build checks.

## Review

Added `scripts/lib/newsletter-template.mjs` as the reusable Resend Broadcast template, updated `newsletter:latest` to load `.env.local`, name broadcasts, and render the template payload, and documented the publish workflow in README. Verified `npm run newsletter:latest`, template escaping/unsubscribe smoke checks, `npm run check:js`, `npm run lint`, `npx tsc -b --pretty false`, `npm run build`, and `git diff --check`.

# Match Newsletter Email To Site Style

- [x] Restyle the broadcast template around the blog glass/terminal visual language.
- [x] Render and inspect the latest-post email.
- [x] Run syntax, lint, type, build, and whitespace checks.

## Review

Restyled the Resend Broadcast template to match the blog with a dark forest shell, prompt-style brand, glass-like panel, tag pills, green CTA, social-card image, and email-safe inline table layout. Rendered latest-post desktop and mobile previews at `/tmp/newsletter-latest-preview.png` and `/tmp/newsletter-latest-preview-mobile.png`; mobile has no horizontal overflow. Adjusted the email brand prompt so `>` stays inline with `Jorgeasaurus`; re-rendered `/tmp/newsletter-brand-desktop.png` and `/tmp/newsletter-brand-mobile.png`. Verified `npm run newsletter:latest`, `npm run check:js`, `npm run lint`, `npx tsc -b --pretty false`, `npm run build`, and `git diff --check`.

# Automate Newsletter Drafts

- [x] Add a GitHub Actions workflow that creates Resend Broadcast drafts only.
- [x] Prevent duplicate drafts for the same slug.
- [x] Document required secrets and the manual Resend send step.
- [x] Verify workflow syntax and project checks.

## Review

Added `.github/workflows/newsletter-draft.yml` to create a Resend Broadcast draft after post content reaches `main`, wait for the production slug, and tag `newsletter-draft/<slug>` to avoid duplicate drafts. Set the three GitHub repository secrets from `.env.local` and verified their names with `gh secret list`. Verified YAML parsing, latest slug resolution, `npm run newsletter:latest` dry-run, `npm run check:js`, `npm run lint`, `npx tsc -b --pretty false`, `npm run build`, and `git diff --check`.

# Add Ad Hoc Resend Template

- [x] Add an ad hoc newsletter template that is not tied to post metadata.
- [x] Add an idempotent Resend Templates API script for create/update/publish.
- [x] Document dry-run and publish usage.
- [x] Verify syntax, lint, type, build, and whitespace checks.

## Review

Added `npm run newsletter:template:adhoc`, backed by the Resend SDK Templates API, to upsert the `newsletter-adhoc` template alias and optionally publish it. Created and published Resend template `545632a1-5cf2-42da-8aaa-50690c2c6a60`. Verified dry-run output, `npm run check:js`, `npm run newsletter:latest`, `npm run lint`, `npx tsc -b --pretty false`, `npm run build`, and `git diff --check`.

# Write EndpointJobs Blog Post

- [x] Research EndpointJobs repo, live page, and refresh workflow.
- [x] Capture page screenshots and create post assets.
- [x] Draft the MDX post around motivation, community value, page behavior, and data refresh.
- [x] Register post metadata and social image.
- [x] Verify lint, build, metadata, and rendered route.

## Review

Added `why-i-built-endpoint-jobs` with desktop/mobile screenshots from `endpointjobs.dev`, a 1200x630 social card, metadata, RSS/sitemap output, and generated static social metadata. Verified `npm run check:js`, `npm run lint`, `npx tsc -b --pretty false`, `npm run build`, `git diff --check`, and local Playwright desktop/mobile route rendering; the only local 404 was Vercel Analytics outside Vercel.

# Refine EndpointJobs Social Card

- [x] Compare current card against stronger recent social-card references.
- [x] Regenerate the card with the Endpoint Jobs page as a clear first signal.
- [x] Verify dimensions, metadata, build, and whitespace.

## Review

Regenerated `public/images/posts/why-i-built-endpoint-jobs/socialcard.png` with a clearer Endpoint Jobs product preview, tighter title hierarchy, product pill, endpoint signal glyph, and stat cards. Verified 1200x630 dimensions, generated `og:image` and `twitter:image` metadata, `npm run build`, and `git diff --check`.

# Add Resend Newsletter Skill

- [x] Check for an existing Resend skill.
- [x] Add a repo-local skill for the blog's Resend workflows.
- [x] Include subscriber, broadcast draft, template, secret, and verification guidance.
- [x] Validate skill structure and relevant project checks.

## Review

No existing Resend-specific skill was present, so I added `.agents/skills/resend-newsletter` and made a narrow `.gitignore` exception for that skill. It covers subscribers, segments, Broadcast drafts, ad hoc Templates, secrets, GitHub Actions, and verification commands. Ruby YAML validation passed; the bundled Python validator could not run because `PyYAML` is unavailable. Verified `npm run check:js`, `npm run newsletter:latest`, `npm run newsletter:template:adhoc`, and `git diff --check`.

# Thermo-Nuclear Code Quality Review

- [x] Map changed files and untracked additions.
- [x] Inspect newsletter scripts, signup API, workflow, and repo-local skill changes.
- [x] Run focused verification checks.

## Review

Found blockers around `.agents` ignore scope, incorrect subscriber counting, and latest-post workflow slug resolution. Verified `git diff --check`, `npm run check:js`, `npm run newsletter:latest`, `npm run newsletter:count -- --json`, and an SDK segment-filtered contact count comparison.

# Fix Newsletter Review Findings

- [x] Restore `.agents` ignore behavior with a narrow Resend skill exception.
- [x] Replace the newsletter count script with the Resend SDK segment filter.
- [x] Resolve newsletter draft slugs from newly added post metadata on push.
- [x] Remove the unused signup source payload.
- [x] Run focused verification checks.

## Review

Restored `.agents/*` with a targeted exception for `.agents/skills/resend-newsletter/**`, switched newsletter counts to `resend.contacts.list({ segmentId })`, guarded the draft workflow so push events only draft when exactly one post slug was added, and removed the unused signup `source` payload. Verified YAML parsing, exact workflow resolver execution for new-post/manual/skip paths, ignored-file behavior, `npm run check:js`, `npm run newsletter:latest`, `npm run newsletter:count -- --json`, `npm run newsletter:template:adhoc`, `npm run lint`, `npx tsc -b --pretty false`, `npm run build`, and `git diff --check`.

# Thermo-Nuclear Code Quality Review 2

- [x] Re-map current dirty branch after fixes.
- [x] Re-inspect newsletter scripts, signup API, workflow, and date handling.
- [x] Run focused and full verification checks.

## Review

Remaining blockers: newsletter date formatting duplicates date parsing and shifts date-only values one day earlier in local time, Resend access is still split across raw REST and SDK paths, and the workflow owns too much inline JavaScript that should live in a checked script. Verified `npm run check:js`, `npm run newsletter:latest`, `npm run newsletter:count -- --json`, workflow YAML parsing, `.agents` ignore behavior, `npm run lint`, `npx tsc -b --pretty false`, `npm run build`, and `git diff --check`.

# Fix Newsletter Review Findings 2

- [x] Share post date parsing between app and scripts.
- [x] Move Resend response handling to a single SDK-based helper.
- [x] Extract newsletter draft slug resolution from workflow YAML.
- [x] Update script checks and docs as needed.
- [x] Run focused and full verification checks.

## Review

Added `src/lib/postDates.mjs` as the shared app/script date boundary, fixed newsletter date-only rendering, and wired RSS/sitemap/post sorting through the same helper. Added `lib/resend.mjs` as the shared Resend SDK boundary and converted signup, broadcast draft, count, and template scripts away from local raw REST wrappers. Extracted workflow slug resolution into `scripts/resolve-newsletter-draft.mjs` and left the workflow as orchestration. Updated README, the Resend skill, and lessons. Verified `npm run check:js`, `npx tsc -b --pretty false`, date regression output, workflow YAML parsing, resolver new-post/manual/skip paths, `npm run newsletter:latest`, `npm run newsletter:count -- --json`, `npm run newsletter:template:adhoc`, invalid signup `400`, rendered newsletter date, `npm run lint`, `npm run build`, skill YAML parsing, and `git diff --check`.

# Address Claude Review Findings

- [x] Confirm Resend raw REST duplication is gone.
- [x] Add shared CLI helper for script flags and local env loading.
- [x] Refactor newsletter scripts to use the shared CLI helper.
- [x] Update checks and guidance.
- [x] Run focused and full verification checks.

## Review

Confirmed Resend SDK access is centralized in `lib/resend.mjs`; the only `new Resend(...)` is the shared factory and no raw Resend REST helpers remain. Added `scripts/lib/cli.mjs` for flag parsing and `.env.local` loading, then refactored latest-post, ad hoc template, and count scripts to use it. Updated `check:js`, the Resend skill, and lessons. Verified duplication search, `npm run check:js`, `npm run newsletter:latest`, `npm run newsletter:template:adhoc`, `npm run newsletter:count -- --json`, `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, YAML parsing, workflow resolver manual path, and `git diff --check`.

# Thermo-Nuclear Code Quality Review 3

- [x] Re-map current dirty branch after Claude follow-up fixes.
- [x] Inspect newsletter helpers, scripts, workflow, API, and UI integration.
- [x] Run focused verification checks.
- [x] Report remaining structural findings.

## Review

Remaining blocker: `lib/resend.mjs` treats every 400 and any message containing `exist` as an existing-resource success, so a failed segment add can resolve as signup success. Verified this with a fake Resend client. Other helper extraction looked clean: raw Resend REST helpers are gone, CLI helpers are centralized, workflow logic is extracted, and file sizes remain healthy. Verified `npm run check:js`, `npm run newsletter:latest`, `npm run newsletter:count -- --json`, fake Resend helper behavior, `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, YAML parsing, and `git diff --check`.

# Fix Resend Duplicate Predicates

- [x] Replace broad existing-resource detection with operation-specific predicates.
- [x] Verify validation and missing-resource errors throw.
- [x] Verify duplicate contact and already-added segment cases still succeed.
- [x] Run focused and full project checks.

## Review

Tightened `lib/resend.mjs` so invalid/missing segment failures still throw while Resend duplicate-contact and already-in-segment validation conflicts resolve idempotently. Verified with fake Resend client cases, `npm run check:js`, `npx tsc -b --pretty false`, `npm run lint`, `npm run newsletter:latest`, `npm run newsletter:count -- --json`, `npm run newsletter:template:adhoc`, invalid signup `400`, `npm run build`, YAML parsing, and `git diff --check`.

# Publish Newsletter Changes To Production

- [x] Confirm branch, Vercel link, and secret safety.
- [x] Run final verification checks.
- [x] Commit current changes on `main`.
- [x] Push `main` to `origin`.
- [x] Fix production URL polling after apex-to-www redirect.
- [x] Bump workflow actions past Node 20 deprecation warnings.
- [x] Deploy Vercel production and verify live routes.

## Review

Committed and pushed the newsletter automation, EndpointJobs post, workflow redirect fix, and workflow action-version bump to `main`. Deployed Vercel production, verified Ready status, aliases, live post route, homepage post/signup rendering, invalid subscribe `400`, manual Resend draft creation, and repeat workflow skip via the newsletter draft tag.

# Write Tenant Graph Blog Post

- [x] Research Tenant Graph repo, live app, and sample flow.
- [x] Capture usable screenshots and create post assets.
- [x] Rename the post away from the repeated "Why I Built" pattern.
- [x] Remove repeated "boring on purpose" wording.
- [x] Draft the MDX post in the Jorgeasaurus field-note style.
- [x] Register post metadata and social image.
- [x] Verify lint, build, metadata, and rendered route.

## Review

Added `tenant-graph-seeing-the-blast-radius` with TenantGraph screenshots, metadata, RSS/sitemap output, and a 1200x630 social card. Also renamed the draft away from the repeated "Why I Built" pattern and removed the repeated "boring on purpose" wording from this draft and the Endpoint Jobs post. Verified `npm run check:js`, `npx tsc -b --pretty false`, `npm run lint`, `npm run build`, generated social metadata, RSS/sitemap entries, desktop/mobile browser render, image availability, `npm run newsletter:latest`, and `git diff --check`.

# Remove Tenant Graph Blog Post

- [x] Remove Tenant Graph post source and post assets.
- [x] Remove Tenant Graph post metadata.
- [x] Regenerate RSS/sitemap output.
- [x] Run verification checks.
- [x] Record review results.

## Review

Removed `tenant-graph-seeing-the-blast-radius` from the blog content, post assets, post metadata, generated RSS, generated sitemap, and generated static output. Left the Projects page Tenant Graph link intact because this task only removed the blog post. Verified `npm run lint`, `npm run build`, `git diff --check`, no post route under `dist`, no post source/assets, and no Tenant Graph post references in `src/content`, RSS, sitemap, or `dist`.

# Research Entra Intune PowerShell Tutorials

- [x] Scan Reddit sentiment and recurring tutorial recommendations.
- [x] Cross-check against Microsoft Learn, GitHub, YouTube/blogs, and training providers.
- [x] Rank high-value tutorials by practical usefulness, freshness, and community trust.
- [x] Record review results and source coverage.

## Review

Researched current Entra, Intune, and PowerShell tutorial sources across Microsoft Learn, GitHub, YouTube metadata, major community blogs, Microsoft/community tools, and attempted Reddit access. Reddit direct/API/search/proxy reads were blocked by network security, so Reddit-derived confidence is lower and explicitly called out. Verified active source freshness for Microsoft Learn pages, Andrew Taylor, Call4Cloud/Patch My PC, MSEndpointMgr, Maester, Merill/Entra.News, Intune Training, and John Savill.

# Research Blog Ideas From Public Sentiment

- [x] Review existing blog coverage to avoid duplicate post ideas.
- [x] Mine current Entra, Intune, and PowerShell pain points from public sources.
- [x] Convert recurring pain points into high-value post angles.
- [x] Rank ideas by fit for this blog and likely reader value.
- [x] Record review results and source coverage.

## Review

Corrected the research target from tutorial recommendations to blog post ideas. Reviewed existing blog coverage, then mined Microsoft Intune what's-new, Microsoft Entra releases/blogs, PowerShell releases/blogs, Graph PowerShell issues, IntuneWin32App issues, Andrew Taylor, Call4Cloud, and Microsoft Tech Community view/comment signals. Reddit remained blocked by network security, so Reddit is treated as a weak/indirect signal only.

# Write Entra Backup And Recovery Post

- [x] Research current Microsoft Entra Backup and Recovery behavior.
- [x] Draft a Jorgeasaurus-style field note focused on what it does not replace.
- [x] Register post metadata and social image.
- [x] Create deterministic 1200x630 social card asset.
- [x] Verify lint, build, generated metadata, and rendered route.
- [x] Record review results.

## Review

Added `entra-backup-and-recovery-is-not-a-tenant-strategy` with official Microsoft references, metadata, RSS/sitemap output, and a deterministic 1200x630 social card. Verified `npm run lint`, `npm run build`, `git diff --check`, social card dimensions, generated `og:image`/`twitter:image`, RSS/sitemap entries, and local route render at `/entra-backup-and-recovery-is-not-a-tenant-strategy` with the expected title, checklist, and 5 official references.

# Deploy Entra Backup Preview

- [x] Inspect Vercel link and current workspace status.
- [x] Create a Vercel preview deployment.
- [x] Verify deployment readiness and post route.
- [x] Record preview URL and review results.

## Review

Created Vercel preview deployment `https://jorgeasaurus-blog-ek8qekjtx-jorgeasaurus-projects.vercel.app`. Verified `Ready` status with `vercel inspect --wait` and confirmed `/entra-backup-and-recovery-is-not-a-tenant-strategy` returns the expected static HTML, title, `og:image`, and `twitter:image` through `vercel curl`.

# Remove Entra Backup Blog Post

- [x] Remove post metadata, source, and social asset.
- [x] Regenerate RSS/sitemap/static output.
- [x] Run verification checks.
- [x] Record review results.

## Review

Removed `entra-backup-and-recovery-is-not-a-tenant-strategy` from blog metadata, deleted its MDX source and social-card asset, and regenerated RSS/sitemap/static output. Verified `npm run lint`, `npm run build`, `git diff --check`, no deleted post files/assets under `dist` or `public/images/posts`, and no remaining site references under `src`, `public`, or `dist`.

# Remove Retired Intune Graph Post

- [x] Remove source, metadata, images, script artifact, and local Graph context files.
- [x] Regenerate feed/sitemap output.
- [x] Verify no stale references remain.
- [x] Record review results.

## Review

Removed the retired Intune Graph post from content, metadata, images, support script files, local Graph context files, feed, sitemap, and prior stale task notes. Verified `npm run lint`, `npm run build`, exact stale-reference search, and `git diff --check`.
# Write TerminalSlides Module Post

- [x] Inspect blog conventions, project guidance, and TerminalSlides source.
- [x] Draft and register the TerminalSlides MDX post.
- [x] Create the required social card.
- [x] Validate code samples, metadata, lint, build, and rendered route.

## Review

Added the TerminalSlides post, registered its metadata and 1200×630 social card, and regenerated RSS and sitemap output. Verified all eight PowerShell code blocks parse, the representative deck validates and exports against TerminalSlides 0.3.1, lint and production build pass, the generated static page has correct Open Graph and Twitter image metadata, and the desktop route renders without horizontal overflow.

# Editorial Review: TerminalSlides Post

- [x] Review voice, structure, code examples, and claims.
- [x] Rank issues and prepare specific revision guidance.

## Review

One code-looking Graph example should use the published Get-MgDeviceManagementManagedDevice cmdlet. The remaining recommendations are editorial: make the validate-before-present workflow explicit, split the overloaded first example, and remove a few generic claims.

# Address TerminalSlides Editorial Review

- [x] Correct the Graph cmdlet and split the first example.
- [x] Add an explicit validate-before-present flow.
- [x] Tighten generic language and improve the media reference.
- [x] Re-parse code blocks and run site verification.

## Review

All 10 PowerShell blocks parse. The revised representative deck validates at 80×24, 120×35, and 160×45 terminal viewports. Lint, production build, diff whitespace, and the rendered desktop route pass; the route includes the new structured-content and validation sections without horizontal overflow.

# Add TerminalSlides Demo Video

- [x] Add the existing module demo to the post's public assets.
- [x] Embed the MP4 using the shared responsive video treatment.
- [x] Verify the video source and rendered post route.

## Review

The copied H.264 MP4 matches the module asset by SHA-256. All 10 PowerShell blocks still parse, lint and production build pass, and the browser loads the video as video/mp4 with playback controls and a rendered 1280×720 frame.

# Add TerminalSlides Project Card

- [x] Add TerminalSlides to the open-source project directory.
- [x] Verify the rendered desktop and mobile project cards.
- [x] Push the update to the existing pull request.

## Review

The TerminalSlides card renders on desktop and mobile with the expected documentation URL, project type, description, tags, and CTA. No horizontal overflow was detected. Lint, production build, and diff whitespace checks passed before the PR update.
