/// <reference types="vite/client" />

// The app targets modern browsers with ES2023 array-copy methods at runtime.
interface Array<T> {
  toSorted(compareFn?: (a: T, b: T) => number): T[]
}

interface ReadonlyArray<T> {
  toSorted(compareFn?: (a: T, b: T) => number): T[]
}

declare module '*.mdx' {
  const component: React.ComponentType
  export default component
  export const title: string
  export const date: string
  export const description: string
  export const tags: string[] | undefined
}
