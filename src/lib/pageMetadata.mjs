export const siteUrl = 'https://www.jorgeasaur.us'
export const siteName = 'Jorgeasaurus'
export const authorName = 'Jorgeasaurus'

const defaultImage = {
  src: '/images/social-card.png',
  width: 1200,
  height: 630,
  type: 'image/png',
}

const pages = {
  home: {
    title: siteName,
    description: 'Personal blog of Jorge Suarez - PowerShell, automation, and engineering.',
    path: '/',
  },
  about: {
    title: 'About',
    description: 'About Jorgeasaurus — engineering notes on PowerShell, endpoint management, Microsoft Graph, and automation.',
    path: '/about',
  },
  projects: {
    title: 'Projects',
    description: 'Projects by Jorgeasaurus: endpoint engineering tools, Microsoft Graph apps, PowerShell modules, and automation projects.',
    path: '/projects',
  },
  'social-card': {
    title: 'Social Card',
    description: 'Internal tool for generating post social card images.',
    path: '/social-card',
  },
  'not-found': {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist.',
    path: '/404',
  },
}

function siteGraph(page, url) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite', '@id': `${siteUrl}/#website`, url: `${siteUrl}/`,
        name: siteName, description: pages.home.description, inLanguage: 'en-US',
        publisher: { '@id': `${siteUrl}/#person` },
      },
      {
        '@type': 'Person', '@id': `${siteUrl}/#person`, name: authorName, url: `${siteUrl}/`,
        sameAs: [
          'https://github.com/jorgeasaurus',
          'https://mvp.microsoft.com/en-US/MVP/profile/79a79af0-1218-4504-b4ee-082ae4ff75f6',
        ],
      },
      {
        '@type': 'WebPage', '@id': url, url, name: page.title, description: page.description,
        isPartOf: { '@id': `${siteUrl}/#website` },
      },
    ],
  }
}

export function getPageMetadata(kind, { post, filtered = false } = {}) {
  if (kind === 'post' && !post) throw new Error('Post metadata is required')
  const page = kind === 'post' ? { ...post, path: `/${post.slug}` } : pages[kind]
  if (!page) throw new Error(`Unknown page metadata kind: ${kind}`)

  const url = `${siteUrl}${page.path}`
  const isArticle = kind === 'post'
  const isUtility = kind === 'social-card' || kind === 'not-found'
  const image = (isArticle && post.socialImage) || defaultImage
  const imageUrl = `${siteUrl}${image.src}`
  const tags = isArticle ? post.tags ?? [] : []
  const meta = [
    { name: 'description', content: page.description },
    { name: 'robots', content: isUtility ? 'noindex,nofollow' : kind === 'home' && filtered ? 'noindex,follow' : 'index,follow' },
    { property: 'og:title', content: page.title },
    { property: 'og:description', content: page.description },
    { property: 'og:site_name', content: siteName },
    { property: 'og:type', content: isArticle ? 'article' : 'website' },
    { property: 'og:url', content: url },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:secure_url', content: imageUrl },
    { property: 'og:image:type', content: image.type ?? defaultImage.type },
    { property: 'og:image:width', content: String(image.width) },
    { property: 'og:image:height', content: String(image.height) },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@jorgeasaurus' },
    { name: 'twitter:creator', content: '@jorgeasaurus' },
    { name: 'twitter:title', content: page.title },
    { name: 'twitter:description', content: page.description },
    { name: 'twitter:image', content: imageUrl },
    ...(isArticle ? [
      { property: 'article:published_time', content: post.date },
      { property: 'article:author', content: authorName },
      ...tags.map((tag) => ({ property: 'article:tag', content: tag })),
    ] : []),
  ]

  const jsonLd = isUtility ? null : isArticle ? {
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
  } : siteGraph(page, url)

  return {
    title: kind === 'home' ? siteName : `${page.title} | ${siteName}`,
    canonical: isUtility ? null : url,
    meta,
    jsonLd,
  }
}
