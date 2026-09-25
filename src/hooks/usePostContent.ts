import { useEffect, useState } from 'react'

type LoadState<T> = { slug: string | undefined } & (
  | { status: 'loading' }
  | { status: 'loaded'; content: T }
  | { status: 'failed' }
)

export default function usePostContent<T>(slug: string | undefined, load: (() => Promise<{ default: T }>) | undefined) {
  const [state, setState] = useState<LoadState<T>>({ slug, status: 'loading' })

  useEffect(() => {
    if (!load) return
    let canceled = false

    async function loadContent() {
      try {
        const module = await load!()
        if (!canceled) setState({ slug, status: 'loaded', content: module.default })
      } catch {
        if (!canceled) setState({ slug, status: 'failed' })
      }
    }

    void loadContent()
    return () => { canceled = true }
  }, [slug, load])

  // Never expose the previous article's content or failure state on navigation.
  if (!load) return { slug, status: 'failed' as const }
  return state.slug === slug ? state : { slug, status: 'loading' as const }
}
