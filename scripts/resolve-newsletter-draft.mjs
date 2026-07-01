#!/usr/bin/env node
import { appendFileSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { comparePostDatesDesc } from '../src/lib/postDates.mjs'
import { loadPosts, parsePostsSource, siteUrl } from './lib/site.mjs'

const execFileAsync = promisify(execFile)

function getEnv(name, fallback = '') {
  return process.env[name]?.trim() || fallback
}

function writeOutputs(outputs) {
  const outputPath = process.env.GITHUB_OUTPUT

  if (outputPath) {
    appendFileSync(
      outputPath,
      Object.entries(outputs)
        .map(([name, value]) => `${name}=${value}`)
        .join('\n') + '\n'
    )
  }

  console.log(JSON.stringify(outputs, null, 2))
}

function newestPost(posts) {
  return [...posts].sort(comparePostDatesDesc)[0]
}

async function loadPreviousPosts(beforeSha) {
  if (!beforeSha || /^0+$/.test(beforeSha)) {
    return []
  }

  try {
    const { stdout } = await execFileAsync('git', [
      'show',
      `${beforeSha}:src/content/posts.ts`,
    ])

    return parsePostsSource(stdout, `${beforeSha}:src/content/posts.ts`)
  } catch (error) {
    console.log(`Could not read previous posts metadata: ${error.message}`)
    return []
  }
}

function getAddedPosts(posts, previousPosts) {
  const previousSlugs = new Set(previousPosts.map((post) => post.slug))

  return posts.filter((post) => post.slug && !previousSlugs.has(post.slug))
}

function validateSlug(slug) {
  if (!slug) {
    throw new Error('No post slug found.')
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error(`Invalid slug: ${slug}`)
  }
}

async function resolveNewsletterDraft() {
  const posts = await loadPosts()
  const eventName = getEnv('GITHUB_EVENT_NAME')
  const beforeSha = getEnv('BEFORE_SHA')
  const baseUrl = getEnv('SITE_URL', siteUrl)
  let slug = getEnv('INPUT_SLUG')

  if (!slug && eventName === 'push') {
    const previousPosts = await loadPreviousPosts(beforeSha)
    const addedPosts = getAddedPosts(posts, previousPosts)

    if (addedPosts.length !== 1) {
      console.log(
        `Skipping draft: expected one newly added post slug, found ${addedPosts.length}. Run workflow_dispatch with a slug for edits or ambiguous pushes.`
      )
      return { skip: 'true' }
    }

    slug = addedPosts[0].slug
  }

  slug ||= newestPost(posts)?.slug
  validateSlug(slug)

  return {
    skip: 'false',
    slug,
    url: `${baseUrl}/${slug}`,
    tag: `newsletter-draft/${slug}`,
  }
}

try {
  writeOutputs(await resolveNewsletterDraft())
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
