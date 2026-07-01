---
name: resend-newsletter
description: Use this skill whenever working on Resend, newsletters, subscriber signup, contacts, segments, broadcasts, ad hoc email templates, email drafts, newsletter GitHub Actions, or anything involving RESEND_API_KEY in the Jorgeasaurus blog repo. Prefer this skill for adding, testing, debugging, or documenting newsletter behavior, even if the user only says "email", "broadcast", "template", "segment", or "notify subscribers."
---

# Resend Newsletter

## Overview

This repo uses Resend for newsletter signup, subscriber counts, latest-post Broadcast drafts, and a reusable ad hoc Template. Keep future changes aligned with the existing scripts instead of creating a parallel email system.

Use official Resend docs for API details when behavior is uncertain:

- Broadcast drafts and sends: https://resend.com/docs/api-reference/broadcasts/create-broadcast
- Sending existing broadcasts: https://resend.com/docs/api-reference/broadcasts/send-broadcast
- Contacts and segments: https://resend.com/docs/api-reference/contacts/create-contact
- Templates and variables: https://resend.com/docs/dashboard/templates/introduction
- Template variables: https://resend.com/docs/dashboard/templates/template-variables

## Current Project Shape

- Signup endpoint: `api/subscribe.js`
- Latest-post broadcast CLI: `scripts/notify-latest-post.mjs`
- Draft slug resolver CLI: `scripts/resolve-newsletter-draft.mjs`
- Subscriber count CLI: `scripts/count-newsletter-members.mjs`
- Ad hoc Resend Template CLI: `scripts/create-adhoc-template.mjs`
- Shared CLI helper: `scripts/lib/cli.mjs`
- Shared Resend SDK helper: `lib/resend.mjs`
- Shared post date helper: `src/lib/postDates.mjs`
- Shared email rendering: `scripts/lib/newsletter-template.mjs`
- Draft automation: `.github/workflows/newsletter-draft.yml`
- Newsletter docs: `README.md`

Environment variables:

- `RESEND_API_KEY`
- `NEWSLETTER_SEGMENT_ID`
- `NEWSLETTER_FROM`

These must exist locally in `.env.local`, in Vercel env vars, and in GitHub Actions repository secrets when automation is involved. Do not print secret values. Verify secret names only.

## Choose The Right Resend Surface

Use Contacts and Segments for subscriber signup and counts.

Use Broadcasts for newsletter messages to the segment. Creating a Broadcast with no `send: true` creates a draft. This is the preferred default.

Use Templates for reusable variable-driven email resources. Templates are not the same thing as the local renderer in `scripts/lib/newsletter-template.mjs`; when the user says "Resend template creation", use the Resend Templates API or `resend.templates.create(...)`.

Use the local email renderer for Broadcast HTML and text that should match the blog's glass/terminal visual language.

## Safety Rules

Default to dry runs and drafts. Do not send email unless the user explicitly asks to send and the command requires an explicit confirmation flag.

For latest-post newsletter work:

```bash
npm run newsletter:latest
npm run newsletter:latest -- --draft --slug post-slug
npm run newsletter:latest -- --send --yes --slug post-slug
```

The dry run should show `"send": false`. `--draft` creates a Resend Broadcast draft. `--send --yes` sends immediately and should be used only after direct user confirmation.

For the automated latest-post workflow, keep draft-only behavior:

- Trigger on `main` changes to `src/content/posts.ts` or `src/content/**/*.mdx`.
- Resolve slugs with `scripts/resolve-newsletter-draft.mjs`; do not put Node logic inline in YAML.
- Create a draft only when a push adds exactly one post slug. Use `workflow_dispatch` with a slug for edits or ambiguous pushes.
- Wait for `https://jorgeasaur.us/<slug>` before creating the draft.
- Tag `newsletter-draft/<slug>` after creating the draft to avoid duplicate drafts.
- Let the user send manually from the Resend dashboard.

For ad hoc messages, use the existing Template script:

```bash
npm run newsletter:template:adhoc
npm run newsletter:template:adhoc -- --publish --yes
```

The current template alias is `newsletter-adhoc`. Variables are `SUBJECT`, `PREHEADER`, `EYEBROW`, `TITLE`, `BODY_HTML`, `BODY_TEXT`, `CTA_LABEL`, and `CTA_URL`.

## Signup And Subscriber Counts

The signup form posts to `/api/subscribe`. The endpoint should:

- Validate the email and honeypot before calling Resend.
- Create a contact with `unsubscribed: false`.
- Add the contact to `NEWSLETTER_SEGMENT_ID`.
- Treat already-existing contacts as success when they can be added to the segment.
- Return generic user-facing errors and log operational details server-side.

Count contacts with:

```bash
npm run newsletter:count
npm run newsletter:count -- --json
```

## Implementation Guidance

Keep edits scoped to the existing files and commands. Add new scripts only when an existing script cannot reasonably be extended.

Use `scripts/lib/cli.mjs` for common script flag parsing and `.env.local` loading. Do not copy `getFlagValue`, `hasFlag`, or `loadLocalEnv` into individual scripts.

Use `lib/resend.mjs` for Resend SDK client creation, response unwrapping, and subscriber contact/segment handling. Do not add raw `fetch` calls to `https://api.resend.com` when the installed SDK supports the operation.

Use `src/lib/postDates.mjs` for post date sorting and formatting in both app and scripts. Do not parse date-only values with `new Date('YYYY-MM-DD')`; it can shift the displayed day.

Use `scripts/lib/newsletter-template.mjs` for brand-consistent email HTML. Keep email markup table-based and inline-styled for client compatibility. Preserve the unsubscribe token:

```text
{{{RESEND_UNSUBSCRIBE_URL}}}
```

When changing Resend SDK usage, inspect the installed SDK types in `node_modules/resend/dist/index.d.mts` and verify against official docs.

When changing GitHub Actions behavior, verify YAML parsing and keep `contents: write` only if tags or commits must be pushed.

## Verification

Use the narrowest checks that prove the change, then broaden when shared behavior changed.

Common checks:

```bash
npm run newsletter:latest
npm run newsletter:template:adhoc
npm run newsletter:count -- --json
npm run check:js
npm run lint
npx tsc -b --pretty false
npm run build
git diff --check
```

Do not run commands that create drafts, publish templates, or send broadcasts unless that mutation is the requested work. When a mutation is requested, report exactly what was created or updated without exposing secrets.
