import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const postsPath = resolve(rootDir, 'src/content/posts.ts')
const distDir = resolve(rootDir, 'dist')
const indexPath = resolve(distDir, 'index.html')
const siteUrl = 'https://jorgeasaur.us'
const defaultImage = {
  src: '/images/social-card.png',
  width: 1200,
  height: 630,
  type: 'image/png',
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function absoluteUrl(path) {
  return path.startsWith('http') ? path : `${siteUrl}${path}`
}

async function loadPosts() {
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

function updateMetaTag(html, selector, value) {
  const escapedValue = escapeHtml(value)
  const pattern = new RegExp(
    `<meta (${selector}) content="[^"]*"\\s*/?>`,
    'u'
  )

  if (pattern.test(html)) {
    return html.replace(pattern, `<meta $1 content="${escapedValue}" />`)
  }

  return html.replace('</head>', `    <meta ${selector} content="${escapedValue}" />\n  </head>`)
}

function buildPostHtml(template, post) {
  const title = `${post.title} | Jorgeasaurus`
  const url = `${siteUrl}/${post.slug}`
  const image = post.socialImage ?? defaultImage
  const imageUrl = absoluteUrl(image.src)

  let html = template.replace(/<title>.*?<\/title>/u, `<title>${escapeHtml(title)}</title>`)

  html = updateMetaTag(html, 'name="description"', post.description)
  html = updateMetaTag(html, 'property="og:title"', post.title)
  html = updateMetaTag(html, 'property="og:description"', post.description)
  html = updateMetaTag(html, 'property="og:type"', 'article')
  html = updateMetaTag(html, 'property="og:url"', url)
  html = updateMetaTag(html, 'property="og:image"', imageUrl)
  html = updateMetaTag(html, 'property="og:image:secure_url"', imageUrl)
  html = updateMetaTag(html, 'property="og:image:type"', image.type ?? defaultImage.type)
  html = updateMetaTag(html, 'property="og:image:width"', image.width)
  html = updateMetaTag(html, 'property="og:image:height"', image.height)
  html = updateMetaTag(html, 'name="twitter:card"', 'summary_large_image')
  html = updateMetaTag(html, 'name="twitter:title"', post.title)
  html = updateMetaTag(html, 'name="twitter:description"', post.description)
  html = updateMetaTag(html, 'name="twitter:image"', imageUrl)

  return html
}

const [template, posts] = await Promise.all([
  readFile(indexPath, 'utf8'),
  loadPosts(),
])

await Promise.all(
  posts.map(async (post) => {
    const postDir = resolve(distDir, post.slug)
    await mkdir(postDir, { recursive: true })
    await writeFile(resolve(postDir, 'index.html'), buildPostHtml(template, post), 'utf8')
  })
)
