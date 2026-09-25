import { useEffect } from 'react'
import { getPageMetadata, type PageKind, type PageMetadataOptions } from '../lib/pageMetadata.mjs'

export default function usePageMetadata(kind: PageKind, { post, filtered }: PageMetadataOptions = {}) {
  useEffect(() => {
    const metadata = getPageMetadata(kind, { post, filtered })
    document.title = metadata.title

    // Replace the entire managed set, including tags from the previous route.
    document.head.querySelectorAll(
      'meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"], meta[property^="article:"], link[rel="canonical"], script#ld-graph'
    ).forEach((element) => element.remove())

    for (const attributes of metadata.meta) {
      const element = document.createElement('meta')
      for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value)
      document.head.append(element)
    }
    if (metadata.canonical) {
      const element = document.createElement('link')
      element.rel = 'canonical'
      element.href = metadata.canonical
      document.head.append(element)
    }
    if (metadata.jsonLd) {
      const element = document.createElement('script')
      element.id = 'ld-graph'
      element.type = 'application/ld+json'
      element.textContent = JSON.stringify(metadata.jsonLd)
      document.head.append(element)
    }
  }, [kind, post, filtered])
}
