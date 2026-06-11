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
- [ ] Update local `main` from `origin/main`.
- [ ] Merge `dev` into `main`.
- [ ] Run verification on `main`.
- [ ] Push `main` to `origin`.

## Review

Pending.
