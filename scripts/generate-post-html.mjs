import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { authorName, escapeXml, loadPosts, siteName, siteUrl } from './lib/site.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const distDir = resolve(rootDir, 'dist')
const indexPath = resolve(distDir, 'index.html')

const defaultImage = {
  src: '/images/social-card.png',
  width: 1200,
  height: 630,
  type: 'image/png',
}

const staticPages = [
  {
    path: 'about',
    config: {
      title: 'About',
      description:
        'About Jorgeasaurus — engineering notes on PowerShell, endpoint management, Microsoft Graph, and automation.',
      ogType: 'website',
      robots: 'index,follow',
      url: `${siteUrl}/about`,
      canonical: `${siteUrl}/about`,
    },
  },
  {
    path: 'projects',
    config: {
      title: 'Projects',
      description:
        'Projects by Jorgeasaurus: endpoint engineering tools, Microsoft Graph apps, PowerShell modules, and automation projects.',
      ogType: 'website',
      robots: 'index,follow',
      url: `${siteUrl}/projects`,
      canonical: `${siteUrl}/projects`,
    },
  },
  {
    path: 'social-card',
    config: {
      title: 'Social Card',
      description: 'Internal tool for generating post social card images.',
      ogType: 'website',
      robots: 'noindex,nofollow',
      url: `${siteUrl}/social-card`,
      canonical: null,
    },
  },
]

function updateMetaTag(html, selector, value) {
  return html.replace(
    new RegExp(`<meta (${selector}) content="[^"]*"\\s*/?>`, 'u'),
    `<meta $1 content="${escapeXml(value)}" />`
  )
}

function applyHead(template, config) {
  const fullTitle = `${config.title} | ${siteName}`
  let html = template.replace(/<title>.*?<\/title>/u, `<title>${escapeXml(fullTitle)}</title>`)

  html = updateMetaTag(html, 'name="description"', config.description)
  html = updateMetaTag(html, 'property="og:title"', config.title)
  html = updateMetaTag(html, 'property="og:description"', config.description)
  html = updateMetaTag(html, 'name="twitter:title"', config.title)
  html = updateMetaTag(html, 'name="twitter:description"', config.description)

  if (config.robots != null) {
    html = updateMetaTag(html, 'name="robots"', config.robots)
  }
  if (config.ogType != null) {
    html = updateMetaTag(html, 'property="og:type"', config.ogType)
  }
  if (config.url != null) {
    html = updateMetaTag(html, 'property="og:url"', config.url)
  }

  if (config.image != null) {
    html = updateMetaTag(html, 'property="og:image"', config.image.url)
    html = updateMetaTag(html, 'property="og:image:secure_url"', config.image.url)
    html = updateMetaTag(html, 'property="og:image:type"', config.image.type)
    html = updateMetaTag(html, 'property="og:image:width"', config.image.width)
    html = updateMetaTag(html, 'property="og:image:height"', config.image.height)
    html = updateMetaTag(html, 'name="twitter:image"', config.image.url)
  }

  if (config.canonical === null) {
    html = html.replace(/\s*<link rel="canonical" href="[^"]*"\s*\/?>/u, '')
  } else {
    html = html.replace(
      /<link rel="canonical" href="[^"]*"\s*\/?>/u,
      `<link rel="canonical" href="${escapeXml(config.canonical)}" />`
    )
  }

  if (config.jsonLd != null) {
    const ldJson = JSON.stringify(config.jsonLd).replaceAll('</', '<\\/')
    html = html.replace(
      /<script type="application\/ld\+json" id="ld-graph">[\s\S]*?<\/script>/u,
      `<script type="application/ld+json" id="ld-graph">${ldJson}</script>`
    )
  }

  if (config.articleMeta != null) {
    const { publishedTime, author, tags = [] } = config.articleMeta
    const articleMetaTags = [
      `<meta property="article:published_time" content="${escapeXml(publishedTime)}" />`,
      `<meta property="article:author" content="${escapeXml(author)}" />`,
      ...tags.map((tag) => `<meta property="article:tag" content="${escapeXml(tag)}" />`),
    ]
    html = html.replace('</head>', `    ${articleMetaTags.join('\n    ')}\n  </head>`)
  }

  return html
}

function postHeadConfig(post) {
  const url = `${siteUrl}/${post.slug}`
  const image = post.socialImage ?? defaultImage
  const imageUrl = `${siteUrl}${image.src}`
  const tags = post.tags ?? []

  return {
    title: post.title,
    description: post.description,
    ogType: 'article',
    url,
    canonical: url,
    image: {
      url: imageUrl,
      width: image.width,
      height: image.height,
      type: image.type ?? defaultImage.type,
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      image: [imageUrl],
      datePublished: post.date,
      dateModified: post.date,
      author: { '@type': 'Person', name: authorName, url: `${siteUrl}/` },
      publisher: { '@type': 'Person', name: siteName, url: `${siteUrl}/` },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      ...(tags.length > 0 ? { keywords: tags.join(', ') } : {}),
    },
    articleMeta: {
      publishedTime: post.date,
      author: authorName,
      tags,
    },
  }
}

const notFoundHeadConfig = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
  robots: 'noindex,nofollow',
  canonical: null,
}

const [template, posts] = await Promise.all([
  readFile(indexPath, 'utf8'),
  loadPosts(),
])

const tasks = [
  ...posts.map((post) => ({
    outputPath: resolve(distDir, post.slug, 'index.html'),
    config: postHeadConfig(post),
  })),
  ...staticPages.map(({ path, config }) => ({
    outputPath: resolve(distDir, path, 'index.html'),
    config,
  })),
  {
    outputPath: resolve(distDir, '404.html'),
    config: notFoundHeadConfig,
  },
]

await Promise.all(
  tasks.map(async ({ outputPath, config }) => {
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, applyHead(template, config), 'utf8')
  })
)
