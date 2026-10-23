// Post metadata and loading utilities
// MDX posts are imported directly where needed
import type { PostCategory } from './postSearch.mjs'
import { comparePostDatesDesc, formatPostDate } from './postDates.mjs'

export interface PostMeta {
  slug: string
  title: string
  date: string
  description: string
  category: PostCategory
  tags?: string[]
  // Optional Q&A pairs, emitted as FAQPage structured data. Keep them identical to the visible FAQ in the MDX.
  faq?: Array<{ question: string; answer: string }>
  socialImage?: {
    src: string
    width: number
    height: number
    type?: string
  }
}

export interface PostImage {
  src: string
  alt: string
  caption?: string
}

export type PostImageSet = PostImage[]

export function formatDate(dateStr: string): string {
  return formatPostDate(dateStr)
}

export function sortPostsByDate(posts: PostMeta[]): PostMeta[] {
  return posts.toSorted(comparePostDatesDesc)
}
