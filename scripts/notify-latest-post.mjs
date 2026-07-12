#!/usr/bin/env node
import { createResend, unwrapResend } from '../lib/resend.mjs'
import { comparePostDatesDesc } from '../src/lib/postDates.mjs'
import { getFlagValue, hasFlag, loadLocalEnv } from './lib/cli.mjs'
import {
  buildNewsletterEmail,
  newsletterTemplateName,
} from './lib/newsletter-template.mjs'
import { loadPosts, siteName, siteUrl } from './lib/site.mjs'

const args = process.argv.slice(2)

function printHelp() {
  console.log(`Usage:
  npm run newsletter:latest
  npm run newsletter:latest -- --slug post-slug
  npm run newsletter:latest -- --draft
  npm run newsletter:latest -- --send --yes

Default mode is a dry run. Use --draft to create a Resend draft broadcast or --send --yes to send immediately.`)
}

loadLocalEnv()

if (hasFlag(args, '--help')) {
  printHelp()
  process.exit(0)
}

const shouldSend = hasFlag(args, '--send')
const shouldDraft = hasFlag(args, '--draft')
const confirmedSend = hasFlag(args, '--yes') || hasFlag(args, '--confirm-send')

if (shouldSend && shouldDraft) {
  console.error('Use either --draft or --send, not both.')
  process.exit(1)
}

if (shouldSend && !confirmedSend) {
  console.error('Refusing to send without --yes. Run --draft first when possible.')
  process.exit(1)
}

const posts = await loadPosts()
const requestedSlug = getFlagValue(args, '--slug')
const sortedPosts = [...posts].sort(comparePostDatesDesc)
const post = requestedSlug
  ? sortedPosts.find((candidate) => candidate.slug === requestedSlug)
  : sortedPosts[0]

if (!post) {
  console.error(requestedSlug ? `Post not found: ${requestedSlug}` : 'No posts found.')
  process.exit(1)
}

const url = `${siteUrl}/${post.slug}`
const subject = `${post.title} | ${siteName}`
const email = buildNewsletterEmail(post, url)
// Resend limits broadcast `name` (internal dashboard label) to 70 characters.
const broadcastName = `${siteName}: ${post.title}`.slice(0, 70)
const payload = {
  segmentId: process.env.NEWSLETTER_SEGMENT_ID ?? 'resend-segment-id',
  from: process.env.NEWSLETTER_FROM ?? `${siteName} <updates@example.com>`,
  name: broadcastName,
  subject,
  html: email.html,
  text: email.text,
}

if (shouldSend) {
  payload.send = true
}

const mode = shouldSend ? 'send' : shouldDraft ? 'draft' : 'dry-run'

if (mode === 'dry-run') {
  console.log(
    JSON.stringify(
      {
        mode,
        post: {
          slug: post.slug,
          title: post.title,
          url,
        },
        broadcast: {
          template: newsletterTemplateName,
          name: payload.name,
          segmentId: payload.segmentId,
          from: payload.from,
          subject: payload.subject,
          send: Boolean(payload.send),
          htmlBytes: Buffer.byteLength(payload.html),
          textBytes: Buffer.byteLength(payload.text),
        },
      },
      null,
      2
    )
  )
  process.exit(0)
}

const missingEnv = ['RESEND_API_KEY', 'NEWSLETTER_SEGMENT_ID', 'NEWSLETTER_FROM'].filter(
  (name) => !process.env[name]
)

if (missingEnv.length > 0) {
  console.error(`Missing required env vars: ${missingEnv.join(', ')}`)
  process.exit(1)
}

try {
  const resend = createResend(process.env.RESEND_API_KEY)
  const result = unwrapResend(
    await resend.broadcasts.create(payload),
    'Broadcast create'
  )

  console.log(
    JSON.stringify(
      {
        mode,
        post: {
          slug: post.slug,
          title: post.title,
          url,
        },
        broadcast: result,
      },
      null,
      2
    )
  )
} catch (error) {
  console.error(error.message)

  if (error.data) {
    console.error(JSON.stringify(error.data, null, 2))
  }

  process.exit(1)
}
