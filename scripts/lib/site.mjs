import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..')
const postsPath = resolve(rootDir, 'src/content/posts.ts')

export const siteUrl = 'https://jorgeasaur.us'
export const siteName = 'Jorgeasaurus'
export const authorName = 'Jorgeasaurus'

export function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export async function loadPosts() {
  const source = await readFile(postsPath, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  })
  const context = {
    exports: {},
    module: { exports: {} },
  }
  vm.runInNewContext(outputText, context, { filename: postsPath })
  return context.exports.default
}
