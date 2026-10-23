import { useSearchParams } from 'react-router-dom'
import {
  categories,
  categoryLabel,
  keywordOptions,
  type PostCategory,
} from '../lib/postSearch.mjs'
import type { PostMeta } from '../lib/posts'

interface PostFiltersProps {
  posts: PostMeta[]
  matchCount: number
}

function statusText(matchCount: number) {
  if (matchCount === 0) return 'No posts match these filters.'
  return matchCount === 1 ? '1 post' : `${matchCount} posts`
}

export default function PostFilters({ posts, matchCount }: PostFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') ?? ''
  const tag = searchParams.get('tag') ?? ''
  const keywords = keywordOptions(posts)
  const keywordChoices = tag && !keywords.includes(tag)
    ? [...keywords, tag].sort((a, b) => a.localeCompare(b, 'en'))
    : keywords
  const categoryChoices = category && !categories.some((item) => item.slug === category)
    ? [...categories, { slug: category as PostCategory, label: categoryLabel(category) }]
    : categories

  function update(key: 'category' | 'tag', value: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('q')
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete('page')
      return next
    })
  }

  return (
    <form className="post-filters" role="search" aria-label="Filter posts" onSubmit={(event) => event.preventDefault()}>
      <div className="post-filters__field">
        <label htmlFor="post-category">Category</label>
        <select
          id="post-category"
          name="category"
          value={category}
          onChange={(event) => update('category', event.target.value)}
        >
          <option value="">All categories</option>
          {categoryChoices.map((item) => (
            <option key={item.slug} value={item.slug}>{item.label}</option>
          ))}
        </select>
      </div>
      <div className="post-filters__field">
        <label htmlFor="post-keyword">Keyword</label>
        <select
          id="post-keyword"
          name="tag"
          value={tag}
          onChange={(event) => update('tag', event.target.value)}
        >
          <option value="">All keywords</option>
          {keywordChoices.map((keyword) => (
            <option key={keyword} value={keyword}>{keyword}</option>
          ))}
        </select>
      </div>
      <p
        className={`post-filter-status${matchCount === 0 ? ' post-filter-status--empty' : ''}`}
        role="status"
      >
        {statusText(matchCount)}
      </p>
    </form>
  )
}
