// Post metadata and loading utilities
// MDX posts are imported directly where needed

export interface PostMeta {
  slug: string
  title: string
  date: string
  description: string
  tags?: string[]
}

export interface PostImage {
  src: string
  alt: string
  caption?: string
}

export type PostImageSet = PostImage[]

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)

  if (Number.isNaN(date.getTime())) {
    return dateStr
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function sortPostsByDate(posts: PostMeta[]): PostMeta[] {
  return [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}
