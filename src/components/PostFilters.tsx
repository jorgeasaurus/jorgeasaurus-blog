import { useEffect, useRef } from 'react'
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
  pending: boolean
  unavailable: boolean
  onRetry: () => void
}

function statusText(pending: boolean, matchCount: number) {
  if (pending) return 'Searching posts...'
  if (matchCount === 0) return 'No posts match these filters.'
  return matchCount === 1 ? '1 post' : `${matchCount} posts`
}

export default function PostFilters({ posts, matchCount, pending, unavailable, onRetry }: PostFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? ''
  const tag = searchParams.get('tag') ?? ''
  const page = searchParams.get('page') ?? ''
  const queryEditSession = useRef(false)
  const queryEditedByInput = useRef(false)
  const previousFilters = useRef({ category, tag, page, query })

  useEffect(() => {
    const resetQueryEditSession = () => {
      queryEditSession.current = false
    }
    window.addEventListener('popstate', resetQueryEditSession)
    return () => window.removeEventListener('popstate', resetQueryEditSession)
  }, [])

  useEffect(() => {
    const previous = previousFilters.current
    const queryChanged = previous.query !== query
    const paginationChanged = previous.page !== page && !queryChanged
    const queryChangedOutsideInput = queryChanged && !queryEditedByInput.current
    if (previous.category !== category || previous.tag !== tag || paginationChanged || queryChangedOutsideInput) {
      queryEditSession.current = false
    }
    queryEditedByInput.current = false
    previousFilters.current = { category, tag, page, query }
  }, [category, tag, page, query])
  const keywords = keywordOptions(posts)
  const keywordChoices = tag && !keywords.includes(tag)
    ? [...keywords, tag].sort((a, b) => a.localeCompare(b, 'en'))
    : keywords
  const categoryChoices = category && !categories.some((item) => item.slug === category)
    ? [...categories, { slug: category as PostCategory, label: categoryLabel(category) }]
    : categories

  function update(key: 'q' | 'category' | 'tag', value: string) {
    const replace = key === 'q' && queryEditSession.current
    queryEditSession.current = key === 'q'
    queryEditedByInput.current = key === 'q'
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (value) next.set(key, value)
      else next.delete(key)
      next.delete('page')
      return next
    }, { replace })
  }

  return (
    <form className="post-filters" role="search" aria-label="Filter posts" onSubmit={(event) => event.preventDefault()}>
      <div className="post-filters__field">
        <label htmlFor="post-search">Search posts</label>
        <input
          id="post-search"
          type="search"
          name="q"
          value={query}
          placeholder="Title, keyword, or phrase"
          autoComplete="off"
          onChange={(event) => update('q', event.target.value)}
        />
      </div>
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
      {unavailable ? (
        <div className="post-filter-recovery">
          <p className="post-filter-status post-filter-status--empty" role="status">
            Search couldn&apos;t load post text.
          </p>
          <button type="button" className="post-filter-retry" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : (
        <p
          className={`post-filter-status${matchCount === 0 && !pending ? ' post-filter-status--empty' : ''}`}
          role="status"
        >
          {statusText(pending, matchCount)}
        </p>
      )}
    </form>
  )
}
