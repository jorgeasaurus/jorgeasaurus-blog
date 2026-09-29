import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

test('Generated sitemap declares the Sitemap 0.9 namespace', () => {
  execFileSync(process.execPath, [fileURLToPath(new URL('./generate-sitemap.mjs', import.meta.url))])
  const sitemap = readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8')
  const namespace = sitemap.match(/<urlset\b[^>]*\bxmlns="([^"]+)"/)?.[1]

  assert.equal(namespace, 'http://www.sitemaps.org/schemas/sitemap/0.9')
})
