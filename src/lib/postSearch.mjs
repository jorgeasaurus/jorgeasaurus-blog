// One primary shelf per post. Tags remain the keyword vocabulary.
export const categories = [
  { slug: 'intune', label: 'Intune' },
  { slug: 'powershell', label: 'PowerShell' },
  { slug: 'microsoft-graph', label: 'Microsoft Graph' },
  { slug: 'endpoint-management', label: 'Endpoint management' },
  { slug: 'ai', label: 'AI' },
  { slug: 'career', label: 'Career' },
]

export function categoryLabel(slug) {
  return categories.find((category) => category.slug === slug)?.label ?? slug ?? ''
}

export function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/ {2,}/g, ' ')
}

// Fenced code is omitted so the homepage index stays prose, headings, and inline names.
export function plainTextFromMdx(source) {
  const withoutFrontmatter = String(source).replace(/^---\r?\n[\s\S]*?\r?\n---/, ' ')
  const withoutFences = withoutFrontmatter
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
  const withoutImages = withoutFences.replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
  const withLinkText = withoutImages.replace(/\[([^\]]*)]\([^)]*\)/g, ' $1 ')
  const withoutTags = withLinkText.replace(/<[^>]+>/g, ' ')
  return normalizeText(withoutTags)
}

export function searchTerms(query) {
  return normalizeText(query).split(' ').filter((term) => term.length >= 2)
}

function haystack(post, body) {
  const faq = (post.faq ?? []).flatMap((entry) => [entry.question, entry.answer])
  return normalizeText([
    post.title,
    post.description,
    post.category,
    categoryLabel(post.category),
    ...(post.tags ?? []),
    ...faq,
    body,
  ].join(' '))
}

export function filterPosts(posts, { query = '', category = '', tag = '' } = {}, bodyBySlug = {}) {
  const terms = searchTerms(query)
  return posts.filter((post) => {
    if (category && post.category !== category) return false
    if (tag && !(post.tags ?? []).includes(tag)) return false
    if (terms.length === 0) return true
    return terms.every((term) => haystack(post, bodyBySlug[post.slug] ?? '').includes(term))
  })
}

export function keywordOptions(posts) {
  return [...new Set(posts.flatMap((post) => post.tags ?? []))]
    .sort((a, b) => a.localeCompare(b, 'en'))
}

export function listingPath({ q, category, tag, page } = {}) {
  const params = new URLSearchParams()
  const query = typeof q === 'string' ? q.trim() : ''
  if (query) params.set('q', query)
  if (category) params.set('category', category)
  if (tag) params.set('tag', tag)
  if (Number(page) > 1) params.set('page', String(page))
  const search = params.toString()
  return search ? `/?${search}` : '/'
}
