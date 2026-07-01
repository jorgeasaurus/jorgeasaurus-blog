// Post metadata and loading utilities
// MDX posts are imported directly where needed
import { comparePostDatesDesc, formatPostDate } from './postDates.mjs'

export interface PostMeta {
  slug: string
  title: string
  date: string
  description: string
  tags?: string[]
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
