import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { plainTextFromMdx } from '../src/lib/postSearch.mjs'

const virtualId = 'virtual:post-search-text'
const resolvedVirtualId = '\0virtual:post-search-text'
const defaultContentDir = fileURLToPath(new URL('../src/content/', import.meta.url))

export function createPostSearchTextPlugin({ contentDir = defaultContentDir } = {}) {
  return {
    name: 'post-search-text',
    resolveId(id) {
      if (id === virtualId) return resolvedVirtualId
    },
    load(id) {
      if (id !== resolvedVirtualId) return null
      const textBySlug = {}
      for (const name of readdirSync(contentDir)) {
        if (!name.endsWith('.mdx')) continue
        const path = join(contentDir, name)
        this.addWatchFile(path)
        textBySlug[name.slice(0, -'.mdx'.length)] = plainTextFromMdx(readFileSync(path, 'utf8'))
      }
      return `export default ${JSON.stringify(textBySlug)}`
    },
  }
}
