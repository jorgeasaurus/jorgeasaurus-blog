export type PostCategory =
  | 'intune'
  | 'powershell'
  | 'microsoft-graph'
  | 'endpoint-management'
  | 'ai'
  | 'career'

export const categories: ReadonlyArray<{ slug: PostCategory; label: string }>

export function categoryLabel(slug: string | null | undefined): string

export interface FilterablePost {
  category?: string
  tags?: string[]
}

export interface PostListFilters {
  category?: string
  tag?: string
}

export function filterPosts<T extends FilterablePost>(
  posts: readonly T[],
  filters?: PostListFilters,
): T[]

export function keywordOptions(posts: readonly { tags?: string[] }[]): string[]

export function cardKeywords(
  post: { category?: string | null; tags?: readonly string[] | null } | null | undefined,
  limit?: number,
): string[]

export interface ListingPathInput {
  category?: string | null
  tag?: string | null
  page?: number | null
}

export function listingPath(filters?: ListingPathInput): string
