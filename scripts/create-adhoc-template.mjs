#!/usr/bin/env node
import { createResend, unwrapResend } from '../lib/resend.mjs'
import {
  adhocNewsletterTemplateAlias,
  adhocNewsletterTemplateName,
  buildAdhocNewsletterTemplate,
} from './lib/newsletter-template.mjs'
import { getFlagValue, hasFlag, loadLocalEnv } from './lib/cli.mjs'

const args = process.argv.slice(2)

function printHelp() {
  console.log(`Usage:
  npm run newsletter:template:adhoc
  npm run newsletter:template:adhoc -- --yes
  npm run newsletter:template:adhoc -- --publish --yes

Options:
  --name       Optional Resend template name. Defaults to ${adhocNewsletterTemplateName}.
  --alias      Optional Resend template alias. Defaults to ${adhocNewsletterTemplateAlias}.
  --publish    Publish the template after create/update.
  --yes        Required to create or update the Resend template.

Default mode is a dry run. The script updates an existing template with the same alias or name; otherwise it creates one.`)
}

async function findExistingTemplate(resend, { name, alias }) {
  const response = await resend.templates.list({ limit: 100 })
  const data = unwrapResend(response, 'Template lookup')

  return data.data.find((template) => template.alias === alias || template.name === name)
}

loadLocalEnv()

if (hasFlag(args, '--help')) {
  printHelp()
  process.exit(0)
}

const name = String(getFlagValue(args, '--name') || adhocNewsletterTemplateName).trim()
const alias = String(getFlagValue(args, '--alias') || adhocNewsletterTemplateAlias).trim()
const shouldPublish = hasFlag(args, '--publish')
const confirmed = hasFlag(args, '--yes')
const payload = buildAdhocNewsletterTemplate({
  name,
  alias,
  from: process.env.NEWSLETTER_FROM,
})

if (!confirmed) {
  console.log(
    JSON.stringify(
      {
        mode: 'dry-run',
        template: {
          name: payload.name,
          alias: payload.alias,
          from: payload.from || null,
          subject: payload.subject,
          publish: shouldPublish,
          htmlBytes: Buffer.byteLength(payload.html),
          textBytes: Buffer.byteLength(payload.text),
          variables: payload.variables.map((variable) => ({
            key: variable.key,
            type: variable.type,
          })),
        },
      },
      null,
      2
    )
  )
  process.exit(0)
}

if (!process.env.RESEND_API_KEY) {
  console.error('Missing required env var: RESEND_API_KEY')
  process.exit(1)
}

try {
  const resend = createResend(process.env.RESEND_API_KEY)
  const existingTemplate = await findExistingTemplate(resend, { name, alias })
  const result = existingTemplate
    ? unwrapResend(
        await resend.templates.update(existingTemplate.id, payload),
        'Template update'
      )
    : unwrapResend(await resend.templates.create(payload), 'Template create')
  const publishResult = shouldPublish
    ? unwrapResend(await resend.templates.publish(result.id), 'Template publish')
    : null

  console.log(
    JSON.stringify(
      {
        mode: shouldPublish ? 'upsert-and-publish' : 'upsert',
        action: existingTemplate ? 'updated' : 'created',
        template: {
          id: result.id,
          name: payload.name,
          alias: payload.alias,
          published: Boolean(publishResult),
        },
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
