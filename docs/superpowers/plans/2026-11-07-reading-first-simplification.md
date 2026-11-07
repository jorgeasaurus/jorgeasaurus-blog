# Reading-first simplification implementation plan

> **For agentic workers:** Execute inline in this session. The design is already approved.

**Goal:** One glass reader, with the approved labels removed and the admin theme deleted.

**Architecture:** Vite React Router SPA. `src/content/posts.ts` remains the only post registry. Routes render `src/pages` directly. No theme provider.

**Tech Stack:** React 19, TypeScript, Vite, MDX, Playwright, node:test.

## Global Constraints

- Stay on `cursor/reading-first-simplification-7a5e`.
- Do not edit PR #50’s branch or `main`.
- No new dependencies, CMS, AI feature, or production settings.
- Preserve glass, wallpaper, Colchuck Lake credit, article bodies, assets, slugs, SEO, RSS, sitemap, JSON-LD, redirects, filter query state, pagination, history, deep links, subscribe API, outline, code copy, and lightbox.
- Legacy theme preferences render this reader, including before paint and when storage throws.
- No theme selector.
- Repair stale-content tests. Delete only coverage that existed to describe the admin theme.

## File map

Delete: `src/admin/`, `src/theme/`, `src/styles/admin-center.css`, `tests/admin-review.spec.ts`.

Modify: `index.html`, `src/main.tsx`, `src/App.tsx`, `src/env.d.ts`, `package.json` (`test:theme` path), `src/components/Topbar.tsx`, `src/components/PostCard.tsx`, `src/components/PostFilters.tsx`, `src/components/NewsletterSignup.tsx`, `src/components/ArticleActions.tsx`, `src/components/ArticleWayfinder.tsx`, `src/components/Icons.tsx`, `src/pages/Home.tsx`, `src/pages/Post.tsx`, `src/pages/About.tsx`, `src/pages/Projects.tsx`, `src/styles/App.css`, and the Playwright tests named below.

Create: `tests/theme-boot.test.mjs`.

## Tasks

### 1. Lock the contract in tests

`tests/theme-boot.test.mjs` reads `index.html` and fails while `blog-theme` or `__BLOG_THEME__` is present.

`tests/theme.spec.ts` replaces the switcher suite:

- `/` has no theme combobox, no `.admin-center`, brand `Jorgeasaurus`, canonical `https://www.jorgeasaur.us/`, and no hydration error.
- `/?theme=admin` shows that same reader, leaves the query in the address bar, does not write `blog-theme`, and keeps the homepage canonical. `Older` navigation drops the theme query and stays on the reader.
- `localStorage` and cookie `blog-theme=admin` set before navigation still show the reader and do not set `data-theme="admin"`.
- Throwing `localStorage` and cookie access still render the reader with no storage error.
- `/?theme=classic&category=intune` presses Intune and stays on the reader.
- Nav links from 901px through 1080px stay inside the primary nav. The wordmark is not clipped at 390px.

Update reader, search, metadata, responsive, and critique tests for the removed headings, card labels, count line, duplicate copy button, and adjacent names. Point `npm run test:theme` at the boot test.

Run the boot test and `tests/theme.spec.ts`. Both fail on the current tree.

### 2. Delete the second interface

Remove the admin tree, admin CSS import, theme provider, switcher, and boot script. `App` renders one element per route. `tsc` has `noUnusedLocals`, so drop the unused imports and `Window.__BLOG_THEME__`.

### 3. Apply the reader cuts

Home: no hero; wordmark `h1` only on `/`; hidden `Posts` heading; filters and cards as specified. Post: one copy button, older/newer names, home link on the missing post. About and Projects: drop the approved labels. Newsletter: status only after an attempt. Desktop wayfinder: no visible `On this page` label. CSS: drop the theme switch and the wordmark `max-width` that clips the name. Home grid no longer reserves an empty hero row.

### 4. Verify

`npm run lint`, `npm run check:js`, `npm run test:sitemap`, `npm run test:search`, `npm run test:theme`, `node --test scripts/post-registry.test.mjs`, `npm run build`, `npx playwright test`. Then desktop and mobile screenshots of home, article, projects, legacy `?theme=admin`, empty filter, and missing post.

## Self-review

- Spec coverage: one interface, legacy theme, blocked storage, before-paint boot, wordmark, missing-post link, copy cuts, preserved SEO and content. Each has a task.
- Contradiction fixed: wordmark is the home `h1` only.
- No second theme API. The boot script is deleted rather than rewritten.
- Admin dashboard’s hardcoded latest-post title is obsolete with the admin theme. Tag uniqueness stays, without sequence numbers.
- Social card and email template taglines are out of scope.
- Placeholder scan: none.
