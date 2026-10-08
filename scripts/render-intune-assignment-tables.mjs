import { chromium } from '@playwright/test'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tables = JSON.parse(await readFile(path.join(root, 'scripts/intune-assignment-tables.json'), 'utf8'))
const assetDir = '/images/posts/intune-assignments-dos-and-donts'
await mkdir(path.join(root, 'public', assetDir), { recursive: true })
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const browser = await chromium.launch({ channel: 'chrome' })
const dimensions = []
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 2 })
  for (const table of tables) {
    const row = (cells, tag) => `<tr>${cells.map((cell) => `<${tag}>${escape(cell)}</${tag}>`).join('')}</tr>`
    await page.setContent(`<html><head><style>
      *{box-sizing:border-box}body{margin:0;background:#0b1518;color:#edf5f3;font-family:Arial,sans-serif}
      main{width:1000px;padding:30px}h1{font-size:30px;line-height:1.2;margin:0 0 24px;color:#4ce3a3}
      table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:22px;line-height:1.4}
      th,td{border:2px solid #799c97;padding:18px;text-align:left;vertical-align:top;overflow-wrap:break-word}
      th{background:#23453f;color:#fff;font-weight:700}td{background:#13252a}tr:nth-child(even) td{background:#1b3135}
      ${table.headers.length === 3 ? 'th:nth-child(1){width:27%}th:nth-child(2){width:35%}th:nth-child(3){width:38%}' : 'th:nth-child(1){width:70%}'}
    </style></head><body><main><h1>${escape(table.title)}</h1><table><thead>${row(table.headers, 'th')}</thead><tbody>${table.rows.map((cells) => row(cells, 'td')).join('')}</tbody></table></main></body></html>`)
    await page.evaluate(() => document.fonts.ready)
    const main = page.locator('main')
    const png = await main.screenshot({ path: path.join(root, 'public', assetDir, `${table.slug}.png`) })
    const width = png.readUInt32BE(16)
    const height = png.readUInt32BE(20)
    dimensions.push(`  '${assetDir}/${table.slug}.png': { width: ${width}, height: ${height} },`)
  }
} finally {
  await browser.close()
}
const metadataPath = path.join(root, 'src/content/imageMetadata.ts')
let metadata = await readFile(metadataPath, 'utf8')
for (const table of tables) {
  metadata = metadata.split('\n').filter((line) => !line.includes(`${assetDir}/${table.slug}.png`)).join('\n')
}
metadata = metadata.replace('\n}\n', `\n${dimensions.join('\n')}\n}\n`)
await writeFile(metadataPath, metadata)
console.log(`Rendered ${tables.length} table images and registered dimensions.`)
