import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { escapeXml, loadPosts } from './lib/site.mjs'
import { getPageMetadata } from '../src/lib/pageMetadata.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = resolve(rootDir, 'dist')
const indexPath = resolve(distDir, 'index.html')

function applyHead(template, metadata) {
  const html = template
    .replace(/<title>.*?<\/title>/u, () => `<title>${escapeXml(metadata.title)}</title>`)
    .replace(/\s*<meta\b[^>]*>/gu, (tag) =>
      /\b(?:name|property)="(?:description|robots|og:[^"]+|twitter:[^"]+|article:[^"]+)"/u.test(tag) ? '' : tag
    )
    .replace(/\s*<link rel="canonical" href="[^"]*"\s*\/?>/gu, '')
    .replace(/\s*<script type="application\/ld\+json" id="ld-graph">[\s\S]*?<\/script>/gu, '')

  const tags = metadata.meta.map((attributes) =>
    `<meta ${Object.entries(attributes).map(([key, value]) => `${key}="${escapeXml(value)}"`).join(' ')} />`
  )
  if (metadata.canonical) tags.push(`<link rel="canonical" href="${escapeXml(metadata.canonical)}" />`)
  if (metadata.jsonLd) {
    const json = JSON.stringify(metadata.jsonLd).replaceAll('<', '\\u003c')
    tags.push(`<script type="application/ld+json" id="ld-graph">${json}</script>`)
  }
  return html.replace('</head>', () => `    ${tags.join('\n    ')}\n  </head>`)
}

const [template, posts] = await Promise.all([readFile(indexPath, 'utf8'), loadPosts()])
const pages = [
  { path: 'index.html', metadata: getPageMetadata('home') },
  ...['about', 'projects', 'social-card'].map((kind) => ({
    path: `${kind}/index.html`, metadata: getPageMetadata(kind),
  })),
  ...posts.map((post) => ({ path: `${post.slug}/index.html`, metadata: getPageMetadata('post', { post }) })),
  { path: '404.html', metadata: getPageMetadata('not-found') },
]
await Promise.all(pages.map(async ({ path, metadata }) => {
  const outputPath = resolve(distDir, path)
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, applyHead(template, metadata), 'utf8')
}))
