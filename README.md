# Jorgeasaurus Blog

Personal field-notes site for PowerShell, endpoint management, Microsoft Graph, automation, and practical engineering notes.

Live site: [Jorgeasaur.us](https://Jorgeasaur.us)

![Jorgeasaurus blog homepage](./WebPage.png)

## Stack

- React
- Vite
- TypeScript
- MDX
- React Router
- Vercel Analytics
- Vercel Functions
- Resend

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run the Vercel function locally:

```bash
vercel dev
```

## Newsletter

Required env vars in Vercel and GitHub Actions repository secrets:

- `RESEND_API_KEY`
- `NEWSLETTER_SEGMENT_ID`
- `NEWSLETTER_FROM`

The signup form posts to `/api/subscribe`. Subscribers are added to `NEWSLETTER_SEGMENT_ID`; count them with `npm run newsletter:count` or `npm run newsletter:count -- --json`.

Newsletter emails use Resend Broadcasts, not Resend transactional Templates. The reusable broadcast template lives in `scripts/lib/newsletter-template.mjs`.

After a post is deployed to production:

```bash
npm run newsletter:latest
npm run newsletter:latest -- --draft --slug post-slug
npm run newsletter:latest -- --send --yes --slug post-slug
```

Dry-run first, create a Resend draft for review, then send explicitly. Omit `--slug` only when the newest post is definitely the one being announced.

Create or update the Resend Template for ad hoc messages:

```bash
npm run newsletter:template:adhoc
npm run newsletter:template:adhoc -- --publish --yes
```

The template alias is `newsletter-adhoc`. It includes `SUBJECT`, `PREHEADER`, `EYEBROW`, `TITLE`, `BODY_HTML`, `BODY_TEXT`, `CTA_LABEL`, and `CTA_URL` variables. Default mode is a dry run; `--yes` creates or updates the template, and `--publish` publishes it.

GitHub Actions uses the same three values as repository secrets. On pushes to `main`, `.github/workflows/newsletter-draft.yml` uses `scripts/resolve-newsletter-draft.mjs` and creates a draft only when the diff adds exactly one post slug; edits or ambiguous pushes should use `workflow_dispatch` with a slug. It waits for `https://jorgeasaur.us/<slug>`, creates a Resend Broadcast draft, then tags `newsletter-draft/<slug>` to avoid duplicate drafts. Send the draft manually from Resend Broadcasts.

## Project Structure

- `src/content/` contains post metadata, MDX posts, and post image mappings.
- `src/pages/` contains the home, about, and post routes.
- `src/components/` contains shared UI components.
- `src/styles/` contains the global and app-level styling.
- `public/images/` contains site and post assets.

## Notes

The site is designed around a glass/terminal-inspired aesthetic with responsive mobile layouts, article hero media, adjacent-post navigation, and reduced-motion/reduced-transparency fallbacks.
