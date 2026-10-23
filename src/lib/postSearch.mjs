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

export function filterPosts(posts, { category = '', tag = '' } = {}) {
  return posts.filter((post) => {
    if (category && post.category !== category) return false
    if (tag && !(post.tags ?? []).includes(tag)) return false
    return true
  })
}

export function keywordOptions(posts) {
  return [...new Set(posts.flatMap((post) => post.tags ?? []))]
    .sort((a, b) => a.localeCompare(b, 'en'))
}

export function listingPath({ category, tag, page } = {}) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (tag) params.set('tag', tag)
  if (Number(page) > 1) params.set('page', String(page))
  const search = params.toString()
  return search ? `/?${search}` : '/'
}
