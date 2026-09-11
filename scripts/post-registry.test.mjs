import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'

const contentDir = new URL('../src/content/', import.meta.url)
const registryPath = new URL('../src/content/posts.ts', import.meta.url)
const draftsDir = new URL('../src/content/_drafts/', import.meta.url)

const publishedSlugs = readdirSync(contentDir)
  .filter((fileName) => fileName.endsWith('.mdx'))
  .map((fileName) => fileName.replace(/\.mdx$/, ''))
  .sort()
const registrySource = readFileSync(registryPath, 'utf8')
const registeredSlugs = [...registrySource.matchAll(/slug: '([^']+)'/g)]
  .map((match) => match[1])
  .sort()

test('Every registered post has one published MDX file', () => {
  assert.deepEqual(publishedSlugs, registeredSlugs)
})

test('The AI post is published without a duplicate drafts directory', () => {
  assert.ok(registeredSlugs.includes('ai-will-take-the-repeatable-work'))
  assert.equal(existsSync(draftsDir), false)
})
