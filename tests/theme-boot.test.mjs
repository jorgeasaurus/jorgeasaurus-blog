import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('the document boot does not select a stored theme', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  assert.equal(html.includes('blog-theme'), false)
  assert.equal(html.includes('__BLOG_THEME__'), false)
  assert.equal(html.includes('data-theme'), false)
})
