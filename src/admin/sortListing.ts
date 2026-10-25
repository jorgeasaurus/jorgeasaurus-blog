import type { PostMeta } from '../lib/posts'
import { comparePostDatesDesc } from '../lib/postDates.mjs'
import { categoryLabel } from '../lib/postSearch.mjs'
import { readingMinutes } from '../lib/readingTime'

export type SortKey = 'title' | 'category' | 'date' | 'reading'
export type SortDirection = 'ascending' | 'descending'

export function sortListing(posts: PostMeta[], key: SortKey, direction: SortDirection) {
  const factor = direction === 'ascending' ? 1 : -1
  return posts.toSorted((a, b) => {
    const primary = key === 'title'
      ? a.title.localeCompare(b.title, 'en', { sensitivity: 'base' })
      : key === 'category'
        ? categoryLabel(a.category).localeCompare(categoryLabel(b.category), 'en', { sensitivity: 'base' })
        : key === 'reading'
          ? readingMinutes(a.slug) - readingMinutes(b.slug)
          : -comparePostDatesDesc(a, b)
    const result = primary === 0
      ? a.title.localeCompare(b.title, 'en', { sensitivity: 'base' })
      : primary
    return result * factor
  })
}

export const sortColumns: Array<{ key: SortKey; label: string }> = [
  { key: 'title', label: 'Title' },
  { key: 'category', label: 'Category' },
  { key: 'date', label: 'Published' },
  { key: 'reading', label: 'Read time' },
]
