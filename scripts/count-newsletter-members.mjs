#!/usr/bin/env node
import { createResend, unwrapResend } from '../lib/resend.mjs'
import { hasFlag, loadLocalEnv } from './lib/cli.mjs'

const args = process.argv.slice(2)
const pageSize = 100

function printHelp() {
  console.log(`Usage:
  npm run newsletter:count
  npm run newsletter:count -- --json

Counts contacts in NEWSLETTER_SEGMENT_ID using the Resend Contacts API.`)
}

async function listAllSegmentContacts(resend, segmentId) {
  const contacts = []
  let after = null

  while (true) {
    const data = unwrapResend(
      await resend.contacts.list({
        segmentId,
        limit: pageSize,
        ...(after ? { after } : {}),
      }),
      'Contact lookup'
    )
    const page = data.data

    contacts.push(...page)

    if (!data.has_more || page.length === 0) {
      break
    }

    after = page.at(-1)?.id

    if (!after) {
      break
    }
  }

  return contacts
}

if (hasFlag(args, '--help')) {
  printHelp()
  process.exit(0)
}

loadLocalEnv()

const apiKey = process.env.RESEND_API_KEY
const segmentId = process.env.NEWSLETTER_SEGMENT_ID
const jsonOutput = hasFlag(args, '--json')

const missingEnv = ['RESEND_API_KEY', 'NEWSLETTER_SEGMENT_ID'].filter(
  (name) => !process.env[name]
)

if (missingEnv.length > 0) {
  console.error(`Missing required env vars: ${missingEnv.join(', ')}`)
  process.exit(1)
}

try {
  const resend = createResend(apiKey)
  const contacts = await listAllSegmentContacts(resend, segmentId)
  const unsubscribed = contacts.filter((contact) => contact?.unsubscribed === true).length
  const total = contacts.length
  const subscribed = total - unsubscribed
  const result = {
    segmentId,
    total,
    subscribed,
    unsubscribed,
  }

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(`Newsletter segment: ${segmentId}`)
    console.log(`Total contacts: ${total}`)
    console.log(`Subscribed contacts: ${subscribed}`)
    console.log(`Unsubscribed contacts: ${unsubscribed}`)
  }
} catch (error) {
  console.error(error.message)

  if (error.data) {
    console.error(JSON.stringify(error.data, null, 2))
  }

  process.exit(1)
}
