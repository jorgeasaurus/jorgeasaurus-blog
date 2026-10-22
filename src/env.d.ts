/// <reference types="vite/client" />

declare module 'virtual:post-search-text' {
  const textBySlug: Record<string, string>
  export default textBySlug
}

declare module '*.mdx' {
  const component: React.ComponentType
  export default component
  export const title: string
  export const date: string
  export const description: string
  export const tags: string[] | undefined
}
