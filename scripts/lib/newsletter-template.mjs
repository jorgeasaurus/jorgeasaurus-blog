import { formatPostDate } from '../../src/lib/postDates.mjs'
import { siteName, siteUrl } from './site.mjs'

export const newsletterTemplateName = 'latest-post-broadcast'
export const adhocNewsletterTemplateName = 'jorgeasaurus-adhoc-message'
export const adhocNewsletterTemplateAlias = 'newsletter-adhoc'
export const adhocNewsletterTemplateVariables = [
  {
    key: 'SUBJECT',
    type: 'string',
    fallbackValue: 'Quick update from Jorgeasaurus',
  },
  {
    key: 'PREHEADER',
    type: 'string',
    fallbackValue: 'A quick update from Jorgeasaurus.',
  },
  {
    key: 'EYEBROW',
    type: 'string',
    fallbackValue: 'Update',
  },
  {
    key: 'TITLE',
    type: 'string',
    fallbackValue: 'Quick update',
  },
  {
    key: 'BODY_HTML',
    type: 'string',
    fallbackValue:
      '<p style="margin:0 0 18px;color:#f8fffb;font-size:17px;line-height:1.58;">Write your message here.</p>',
  },
  {
    key: 'BODY_TEXT',
    type: 'string',
    fallbackValue: 'Write your message here.',
  },
  {
    key: 'CTA_LABEL',
    type: 'string',
    fallbackValue: 'Read more',
  },
  {
    key: 'CTA_URL',
    type: 'string',
    fallbackValue: siteUrl,
  },
]

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderBrandHeader(escapedSiteName) {
  return `<tr>
              <td style="padding:22px 28px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="color:#ffffff;font-size:16px;font-weight:700;letter-spacing:-0.03em;white-space:nowrap;">
                      <span style="display:inline-block;margin-right:6px;color:#d7ffe3;font:700 14px 'Courier New',monospace;line-height:1;vertical-align:1px;">&gt;</span>
                      ${escapedSiteName}
                    </td>
                    <td align="right" style="color:#d7ffe3;font:700 11px 'Courier New',monospace;letter-spacing:0.14em;text-transform:uppercase;">Learn. Build. Automate.</td>
                  </tr>
                </table>
              </td>
            </tr>`
}

function renderNewsletterShell({ title, preview, contentHtml, afterContentHtml = '' }) {
  const escapedTitle = escapeHtml(title)
  const escapedPreview = escapeHtml(preview)
  const escapedSiteName = escapeHtml(siteName)

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapedTitle}</title>
  </head>
  <body style="margin:0;background:#06100b;color:#f8fffb;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">${escapedPreview}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#06100b;background-image:radial-gradient(circle at 20% 10%,#264a36 0,#06100b 34%),radial-gradient(circle at 90% 20%,#304414 0,#06100b 32%);margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:34px 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#10251a;background-image:linear-gradient(135deg,#1c3b2a 0%,#0d2116 54%,#16220c 100%);border:1px solid #52705e;border-radius:28px;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,0.35);">
            ${renderBrandHeader(escapedSiteName)}
            ${contentHtml}
            ${afterContentHtml}
            <tr>
              <td style="padding:18px 28px 28px;border-top:1px solid #355743;background:#07110c;">
                <p style="margin:0;color:#b9d8c4;font-size:13px;line-height:1.5;">
                  You are receiving this because you joined the ${escapedSiteName} email list.
                  <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#d7ffe3;">Unsubscribe</a>.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function buildNewsletterEmail(post, url) {
  const title = escapeHtml(post.title)
  const description = escapeHtml(post.description)
  const date = escapeHtml(formatPostDate(post.date))
  const href = escapeHtml(url)
  const preview = `${post.title}: ${post.description}`
  const tags = Array.isArray(post.tags) ? post.tags.slice(0, 4) : []
  const tagHtml = tags
    .map((tag) => {
      const escapedTag = escapeHtml(tag)
      return `<span style="display:inline-block;margin:0 6px 8px 0;padding:7px 10px;border:1px solid #4d705c;border-radius:999px;background:#0b1a12;color:#d7ffe3;font:700 11px 'Courier New',monospace;letter-spacing:0.08em;text-transform:uppercase;">${escapedTag}</span>`
    })
    .join('')
  const socialImage = post.socialImage?.src
    ? new URL(post.socialImage.src, siteUrl).href
    : null
  const imageHtml = socialImage
    ? `<tr>
              <td style="padding:0 28px 24px;">
                <a href="${href}" style="display:block;text-decoration:none;">
                  <img src="${escapeHtml(socialImage)}" alt="${title}" width="584" style="display:block;width:100%;max-width:584px;height:auto;border:1px solid #355743;border-radius:18px;background:#06100b;">
                </a>
              </td>
            </tr>`
    : ''

  return {
    html: renderNewsletterShell({
      title: post.title,
      preview,
      contentHtml: `<tr>
              <td style="padding:28px 28px 18px;">
                <p style="margin:0 0 12px;color:#9df0b6;font:700 12px 'Courier New',monospace;letter-spacing:0.16em;text-transform:uppercase;">New field note</p>
                <h1 style="margin:0 0 12px;color:#ffffff;font-size:36px;line-height:1.04;letter-spacing:-0.04em;">${title}</h1>
                <p style="margin:0 0 20px;color:#dfffea;font-size:14px;">${date}</p>
                <p style="margin:0 0 20px;color:#f8fffb;font-size:17px;line-height:1.58;">${description}</p>
                ${tagHtml ? `<p style="margin:0 0 22px;">${tagHtml}</p>` : ''}
                <p style="margin:0;">
                  <a href="${href}" style="display:inline-block;border-radius:999px;background:#9df0b6;color:#06100b;font-weight:700;padding:12px 18px;text-decoration:none;">Read field note</a>
                </p>
              </td>
            </tr>`,
      afterContentHtml: imageHtml,
    }),
    text: `New field note: ${post.title}

${formatPostDate(post.date)}

${post.description}

Read the post: ${url}

Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}
`,
  }
}

export function buildAdhocNewsletterTemplate({ name, alias, from } = {}) {
  const template = {
    name: name || adhocNewsletterTemplateName,
    alias: alias || adhocNewsletterTemplateAlias,
    subject: '{{{SUBJECT}}}',
    html: renderNewsletterShell({
      title: '{{{SUBJECT}}}',
      preview: '{{{PREHEADER}}}',
      contentHtml: `<tr>
              <td style="padding:28px 28px 24px;">
                <p style="margin:0 0 12px;color:#9df0b6;font:700 12px 'Courier New',monospace;letter-spacing:0.16em;text-transform:uppercase;">{{{EYEBROW}}}</p>
                <h1 style="margin:0 0 18px;color:#ffffff;font-size:36px;line-height:1.04;letter-spacing:-0.04em;">{{{TITLE}}}</h1>
                {{{BODY_HTML}}}
                <p style="margin:4px 0 0;">
                  <a href="{{{CTA_URL}}}" style="display:inline-block;border-radius:999px;background:#9df0b6;color:#06100b;font-weight:700;padding:12px 18px;text-decoration:none;">{{{CTA_LABEL}}}</a>
                </p>
              </td>
            </tr>`,
    }),
    text: `{{{TITLE}}}

{{{BODY_TEXT}}}

{{{CTA_LABEL}}}: {{{CTA_URL}}}

Unsubscribe: {{{RESEND_UNSUBSCRIBE_URL}}}
`,
    variables: adhocNewsletterTemplateVariables,
  }

  if (from) {
    template.from = from
  }

  return template
}
