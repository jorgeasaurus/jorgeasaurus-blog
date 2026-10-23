import { Children, isValidElement, useEffect, useRef, useState } from 'react'
import { IconCheck, IconCopy } from './Icons'
import { copyText } from '../lib/copyText'

const languageLabels: Record<string, string> = {
  powershell: 'PowerShell',
  ps1: 'PowerShell',
  pwsh: 'PowerShell',
  json: 'JSON',
  bash: 'Bash',
  sh: 'Bash',
  shell: 'Bash',
  zsh: 'Bash',
  typescript: 'TypeScript',
  ts: 'TypeScript',
  tsx: 'TypeScript',
  javascript: 'JavaScript',
  js: 'JavaScript',
  jsx: 'JavaScript',
  kql: 'KQL',
  kusto: 'KQL',
  xml: 'XML',
  html: 'XML',
  css: 'CSS',
  text: 'Text',
  plaintext: 'Text',
  txt: 'Text',
}

function languageFromChildren(children: React.ReactNode) {
  for (const node of Children.toArray(children)) {
    if (!isValidElement<{ className?: string }>(node)) continue
    const match = /(?:^|\s)language-([\w-]+)/.exec(node.props.className ?? '')
    if (!match) continue
    const key = match[1].toLowerCase()
    return languageLabels[key] ?? 'Code'
  }
  return 'Code'
}

export default function CodeBlock({ children }: { children?: React.ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  const language = languageFromChildren(children)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copyCode() {
    const value = preRef.current?.innerText ?? ''
    if (!value || !(await copyText(value))) return
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block">
      <div className="code-block__header">
        <span className="code-block__language">{language}</span>
        <button
          className="code-block__copy"
          type="button"
          aria-label="Copy code to clipboard"
          onClick={() => { void copyCode() }}
        >
          {copied ? <IconCheck /> : <IconCopy />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre ref={preRef}>{children}</pre>
      <span className="visually-hidden" aria-live="polite">{copied ? 'Copied' : ''}</span>
    </div>
  )
}
