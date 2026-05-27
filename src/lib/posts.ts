// Post metadata and loading utilities
// MDX posts are imported directly where needed

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

function parsePostDate(dateStr: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr)

  if (dateOnly) {
    const [, year, month, day] = dateOnly
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

  return new Date(dateStr)
}

export function formatDate(dateStr: string): string {
  const date = parsePostDate(dateStr)

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
    (a, b) => parsePostDate(b.date).getTime() - parsePostDate(a.date).getTime()
  )
}
