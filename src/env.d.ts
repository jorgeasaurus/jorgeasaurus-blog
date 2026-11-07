/// <reference types="vite/client" />

declare module '*.mdx' {
  const component: React.ComponentType
  export default component
  export const title: string
  export const date: string
  export const description: string
  export const tags: string[] | undefined
}
