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
