export type PostCategory =
  | 'intune'
  | 'powershell'
  | 'microsoft-graph'
  | 'endpoint-management'
  | 'ai'
  | 'career'

export const categories: ReadonlyArray<{ slug: PostCategory; label: string }>

export function categoryLabel(slug: string | null | undefined): string
export function normalizeText(value: string | null | undefined): string
export function plainTextFromMdx(source: string): string
export function searchTerms(query: string | null | undefined): string[]

export interface SearchablePost {
  slug: string
  title: string
  description: string
  category?: string
  tags?: string[]
  faq?: Array<{ question: string; answer: string }>
}

export interface PostSearchFilters {
  query?: string
  category?: string
  tag?: string
}

export function filterPosts<T extends SearchablePost>(
  posts: readonly T[],
  filters?: PostSearchFilters,
  bodyBySlug?: Record<string, string>,
): T[]

export function keywordOptions(posts: readonly { tags?: string[] }[]): string[]

export interface ListingPathInput {
  q?: string | null
  category?: string | null
  tag?: string | null
  page?: number | null
}

export function listingPath(filters?: ListingPathInput): string
