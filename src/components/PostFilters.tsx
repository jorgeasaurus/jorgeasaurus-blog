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

function countFor(posts: PostMeta[], category: string, tag: string) {
  return posts.filter((post) => {
    if (category && post.category !== category) return false
    if (tag && !(post.tags ?? []).includes(tag)) return false
    return true
  }).length
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
      <div className="category-pills" role="group" aria-label="Category quick filters">
        <button
          className={`category-pill${category === '' ? ' category-pill--active' : ''}`}
          type="button"
          aria-pressed={category === ''}
          onClick={() => update('category', '')}
        >
          <span>All</span>
          <span className="category-pill__count">{countFor(posts, '', tag)}</span>
        </button>
        {categoryChoices.map((item) => {
          const active = category === item.slug
          return (
            <button
              key={item.slug}
              className={`category-pill${active ? ' category-pill--active' : ''}`}
              type="button"
              aria-pressed={active}
              onClick={() => update('category', item.slug)}
            >
              <span>{item.label}</span>
              <span className="category-pill__count">{countFor(posts, item.slug, tag)}</span>
            </button>
          )
        })}
      </div>
      <div className="post-filters__field">
        <label htmlFor="field-note-category">Category</label>
        <select
          id="field-note-category"
          name="category"
          aria-label="Category"
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
        <label htmlFor="field-note-tag">Keyword</label>
        <select
          id="field-note-tag"
          name="tag"
          aria-label="Keyword"
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
