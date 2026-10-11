import { chromium } from '@playwright/test'
import { mkdir, writeFile, readFile } from 'node:fs/promises'

const directory = 'public/images/posts/bitlocker-startup-pin-after-autopilot'
await mkdir(directory, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  await page.setContent(`<html><head><style>*{box-sizing:border-box}body{margin:0;background:#080f11;color:#e7f0f0;font-family:Arial,sans-serif}.card{position:absolute;inset:38px;border:1px solid #315b5d;border-radius:24px;background:#112126;padding:40px 66px}.line{border-left:7px solid #31d7a0;padding-left:27px;height:400px}.brand{font-size:28px;font-weight:700;color:#31d7a0;margin:0 0 50px}h1{font-size:61px;line-height:1.15;letter-spacing:-2px;margin:0 0 32px}p{font-size:28px;color:#a7bfba;margin:0 0 43px}.code{font:700 22px monospace;color:#31d7a0}</style></head><body><div class="card"><div class="line"><div class="brand">JORGEASAURUS</div><h1>Add a BitLocker startup PIN<br>after Autopilot</h1><p>PowerShell UI · Intune policy · Desktop readiness</p><div class="code">&gt; Encrypt. Enroll. Test startup.</div></div></div></body></html>`)
  await page.screenshot({ path: `${directory}/socialcard.png` })
  await page.setViewportSize({ width: 1100, height: 1100 })
  const rows = [
    ['Require additional authentication at startup', 'Enabled'],
    ['Allow BitLocker without a compatible TPM', 'False'],
    ['Configure TPM startup', 'Allow TPM'],
    ['Configure TPM startup PIN', 'Require startup PIN with TPM'],
    ['Configure TPM startup key', 'Do not allow'],
    ['Configure TPM startup key and PIN', 'Do not allow'],
    ['Configure minimum PIN length for startup', 'Enabled: 6'],
    ['Preboot keyboard input on slates', 'Conditional: verified hardware only'],
  ]
  await page.setContent(`<html><head><style>*{box-sizing:border-box}body{margin:0;font:23px/1.4 Arial;background:#0b1518;color:#edf5f3}main{padding:32px;width:1100px}h1{font-size:34px;margin:0 0 8px;color:#4ce3a3}p{font-size:21px;color:#a7bfba;margin:0 0 25px}table{border-collapse:collapse;width:100%}th,td{border:2px solid #799c97;padding:16px;text-align:left}th{background:#23453f}td{background:#13252a}td:first-child{width:60%}</style></head><body><main><h1>Post-encryption BitLocker PIN policy</h1><p>Configuration reference · Endpoint security → Disk encryption → Windows → BitLocker</p><table><tr><th>Setting</th><th>Value</th></tr>${rows.map(([setting, value]) => `<tr><td>${setting}</td><td>${value}</td></tr>`).join('')}</table><p style="margin-top:20px">Retain reviewed recovery and encryption settings. Assign after provisioning.</p></main></body></html>`)
  const image = await page.locator('main').screenshot({ path: `${directory}/policy-reference.png` })
  const metadataPath = 'src/content/imageMetadata.ts'
  let metadata = await readFile(metadataPath, 'utf8')
  const key = '/images/posts/bitlocker-startup-pin-after-autopilot/policy-reference.png'
  metadata = metadata.split('\n').filter((line) => !line.includes(key)).join('\n')
  metadata = metadata.replace('\n}\n', `\n  '${key}': { width: ${image.readUInt32BE(16)}, height: ${image.readUInt32BE(20)} },\n}\n`)
  await writeFile(metadataPath, metadata)
} finally { await browser.close() }
