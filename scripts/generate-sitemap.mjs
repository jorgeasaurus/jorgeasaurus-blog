import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { comparePostDatesDesc, formatPostDateIso } from '../src/lib/postDates.mjs'
import { escapeXml, loadPosts, siteUrl } from './lib/site.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const outputPath = resolve(rootDir, 'public/sitemap.xml')

function buildSitemap(posts) {
  const sortedPosts = [...posts].sort(comparePostDatesDesc)
  const latestDate = sortedPosts[0]
    ? formatPostDateIso(sortedPosts[0].date)
    : new Date().toISOString().slice(0, 10)

  const entries = [
    `  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${latestDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`,
    `  <url>
    <loc>${siteUrl}/about</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>`,
    `  <url>
    <loc>${siteUrl}/projects</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`,
    ...sortedPosts.map((post) => `  <url>
    <loc>${escapeXml(`${siteUrl}/${post.slug}`)}</loc>
    <lastmod>${formatPostDateIso(post.date)}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.8</priority>
  </url>`),
  ].join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap-0.9">
${entries}
</urlset>
`
}

const posts = await loadPosts()
const sitemap = buildSitemap(posts)

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, sitemap, 'utf8')
