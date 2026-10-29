import assert from 'node:assert/strict'
import test from 'node:test'
import { loadPosts } from '../../scripts/lib/site.mjs'
import {
  cardKeywords,
  categories,
  filterPosts,
  listingPath,
} from './postSearch.mjs'

const categorySlugs = categories.map((category) => category.slug)

test('category and keyword filters combine', () => {
  const posts = [
    {
      title: 'Back Up or Restore Jamf Pro Objects with PowerShell',
      description: 'A PowerShell tool for backing up and restoring Jamf Pro configurations.',
      category: 'endpoint-management',
      tags: ['powershell', 'jamf', 'mdm'],
    },
    {
      title: 'Intune Gotchas Every Admin Learns Eventually',
      description: 'The Microsoft Intune behaviors that surprise admins.',
      category: 'intune',
      tags: ['intune'],
    },
  ]

  assert.deepEqual(
    filterPosts(posts, { category: 'endpoint-management', tag: 'jamf' }).map((post) => post.category),
    ['endpoint-management'],
  )
  assert.deepEqual(
    filterPosts(posts, { category: 'intune', tag: 'jamf' }),
    [],
  )
  assert.equal(filterPosts(posts, { category: 'intune' }).length, 1)
})

test('listing paths keep category, keyword, and page shareable', () => {
  assert.equal(listingPath({}), '/')
  assert.equal(
    listingPath({ category: 'intune', tag: 'windows', page: 2 }),
    '/?category=intune&tag=windows&page=2',
  )
  assert.equal(listingPath({ category: '', tag: null, page: 1 }), '/')
  assert.equal(listingPath({ category: 'ai' }), '/?category=ai')
})

const categoryBySlug = {
  'microsoft-graph-delegated-vs-application-permissions': 'microsoft-graph',
  'intune-compliance-to-conditional-access': 'intune',
  'powershell-try-catch-misses-errors': 'powershell',
  'learn-intune-powershell-automation': 'intune',
  'bitlocker-startup-pin-after-autopilot': 'intune',
  'intune-assignments-dos-and-donts': 'intune',
  'windows-custom-compliance-with-intune': 'intune',
  'intune-deployments-schedule-the-rollout': 'intune',
  'ai-will-take-the-repeatable-work': 'career',
  'build-terminal-presentations-with-powershell': 'powershell',
  'use-cpm-with-openrouter-models': 'ai',
  'manage-vs-code-extensions-with-intune-remediations': 'intune',
  'minimize-autopilot-device-preparation-provisioning-time': 'intune',
  'why-i-built-endpoint-jobs': 'endpoint-management',
  'make-yourself-obsolete': 'career',
  'intune-gotchas-every-admin-learns-eventually': 'intune',
  'intune-hydration-kit-has-a-tui-now': 'intune',
  'mmsmoa-2026-endpoint-management-is-engineering-now': 'endpoint-management',
  'reusable-intune-remediation-template': 'intune',
  'creating-dynamic-device-model-groups-in-entra-with-powershell': 'intune',
  'set-up-and-view-app-inventory-data-in-intune': 'intune',
  'ai-agents-changed-how-i-build-things': 'ai',
  'hello-world': 'career',
  'powershell-summit-2026-we-are-all-insane-and-that-is-the-opportunity': 'powershell',
  'using-net-methods-in-powershell-with-practical-examples-youll-actually-reuse': 'powershell',
  'bootstrap-your-intune-tenant-in-a-single-command': 'intune',
  'finding-wmi-usage-before-microsoft-finds-it-for-you': 'powershell',
  'winget-without-winget-building-a-cross-platform-package-manifest-fetcher': 'powershell',
  'supercharge-microsoft-graph-api-data-retrieval-with-powershell-batch-requests': 'microsoft-graph',
  'are-you-even-good-enough-to-have-imposter-syndrome': 'career',
  'back-up-or-restore-jamf-pro-objects-with-powershell': 'endpoint-management',
  'synchronizing-device-groups-with-entra-user-groups-using-powershell': 'intune',
  'syncing-abm-and-vpp-tokens-with-intune-a-powershell-script-for-the-lazy-admin': 'intune',
  'automating-device-management-with-powershell-function-invoke-appinstalleddevicesgroup': 'intune',
  'intune-device-queries-to-level-up-your-device-management': 'intune',
  'streamlining-application-detection-in-intune-and-mecm-with-powershell': 'intune',
  'top-20-graph-api-cmdlets': 'microsoft-graph',
  'using-filters-to-assign-apps-policies-and-profiles-in-microsoft-intune': 'intune',
  'proactive-remediation-to-remind-windows-users-to-reboot': 'intune',
  'find-registry-uninstall-keys-with-powershell': 'powershell',
}

test('every published post keeps its backfilled category and title keywords', async () => {
  const posts = await loadPosts()
  const actual = Object.fromEntries(posts.map((post) => [post.slug, post.category]))

  assert.deepEqual(actual, categoryBySlug)
  for (const post of posts) {
    assert.equal(categorySlugs.includes(post.category), true, post.slug)
  }

  const bySlug = Object.fromEntries(posts.map((post) => [post.slug, post]))
  assert.ok(bySlug['bitlocker-startup-pin-after-autopilot'].tags.includes('bitlocker'))
  assert.ok(bySlug['bitlocker-startup-pin-after-autopilot'].tags.includes('autopilot'))
  assert.ok(bySlug['hello-world'].tags.includes('mdx'))
  assert.ok(bySlug['using-filters-to-assign-apps-policies-and-profiles-in-microsoft-intune'].tags.includes('filters'))
})

test('card keywords drop case-insensitive repeats and the category chip', () => {
  assert.deepEqual(
    cardKeywords({
      category: 'intune',
      tags: ['Intune', 'intune', 'PowerShell', 'powershell', 'Windows'],
    }),
    ['PowerShell', 'Windows'],
  )
  assert.deepEqual(
    cardKeywords({
      category: 'microsoft-graph',
      tags: ['Microsoft Graph', 'microsoft-graph', 'batch', 'powershell', 'api', 'automation'],
    }),
    ['batch', 'powershell', 'api', 'automation'],
  )
  assert.deepEqual(cardKeywords({ category: 'career', tags: [] }), [])
})

test('published tag lists have no case-insensitive duplicates', async () => {
  const posts = await loadPosts()
  for (const post of posts) {
    const seen = new Set()
    for (const tag of post.tags ?? []) {
      const key = String(tag).trim().toLowerCase()
      assert.equal(seen.has(key), false, `${post.slug} repeats ${tag}`)
      seen.add(key)
    }
  }

  const repeated = ['33', '34', '35']
  const sorted = [...posts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  for (const number of repeated) {
    const post = sorted[sorted.length - Number(number)]
    const labels = [post.category, ...cardKeywords(post)].map((value) => String(value).toLowerCase())
    assert.equal(new Set(labels).size, labels.length, `No. ${number} ${post.slug}`)
    assert.equal(labels.filter((label) => label === 'intune').length, 1)
  }
})
