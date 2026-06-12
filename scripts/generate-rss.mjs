import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { escapeXml, loadPosts, siteUrl } from './lib/site.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const outputPath = resolve(rootDir, 'public/rss.xml')
const feedTitle = 'Jorgeasaurus'
const feedDescription =
  'Field notes on PowerShell, endpoint management, Microsoft Graph, and automation.'

function buildRss(posts) {
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const latestPost = sortedPosts[0]
  const lastBuildDate = latestPost
    ? new Date(latestPost.date).toUTCString()
    : new Date().toUTCString()

  const items = sortedPosts
    .map((post) => {
      const url = `${siteUrl}/${post.slug}`
      const categories = (post.tags ?? [])
        .map((tag) => `      <category>${escapeXml(tag)}</category>`)
        .join('\n')

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
${categories}
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(feedTitle)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <atom:link href="${escapeXml(siteUrl)}/rss.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(feedDescription)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`
}

const posts = await loadPosts()
const rss = buildRss(posts)

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, rss, 'utf8')
