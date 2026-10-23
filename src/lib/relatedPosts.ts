import type { PostMeta } from './posts'

export function relatedFieldNotes(post: PostMeta, posts: readonly PostMeta[], limit = 3) {
  const tags = new Set(post.tags ?? [])
  return posts
    .filter((item) => item.slug !== post.slug)
    .map((item) => {
      const shared = (item.tags ?? []).reduce((count, tag) => count + (tags.has(tag) ? 1 : 0), 0)
      const score = (item.category === post.category ? 4 : 0) + shared
      return { item, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.item.date.localeCompare(a.item.date))
    .slice(0, limit)
    .map((entry) => entry.item)
}
