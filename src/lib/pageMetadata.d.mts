import type { PostMeta } from './posts'

export const siteUrl: string
export const siteName: string
export const authorName: string
export type PageKind = 'home' | 'about' | 'projects' | 'social-card' | 'not-found' | 'post'
export interface PageMetadataOptions {
  post?: PostMeta
  filtered?: boolean
}
export interface PageMetadata {
  title: string
  canonical: string | null
  meta: Array<{ name: string; property?: never; content: string } | { property: string; name?: never; content: string }>
  jsonLd: Record<string, unknown> | null
}
export function getPageMetadata(kind: PageKind, options?: PageMetadataOptions): PageMetadata
export function serializeJsonLd(value: Record<string, unknown>): string
