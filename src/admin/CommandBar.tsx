import { useEffect, useRef, useState } from 'react'
import { copyText } from '../lib/copyText'
import AdminIcon from './icons'

interface CommandBarProps {
  mode?: 'list' | 'page'
}

export default function CommandBar({ mode = 'page' }: CommandBarProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function share() {
    const ok = await copyText(window.location.href)
    if (!ok) return
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="ac-command" role="toolbar" aria-label="Commands">
      <button type="button" onClick={() => window.location.reload()}>
        <AdminIcon name="refresh" />
        Refresh
      </button>
      {mode === 'list' && (
        <button
          type="button"
          onClick={() => document.getElementById('field-note-tag')?.focus()}
        >
          <AdminIcon name="filter" />
          Filter
        </button>
      )}
      <a href="/rss.xml">
        <AdminIcon name="download" />
        Export
      </a>
      <button type="button" onClick={() => { void share() }}>
        <AdminIcon name="share" />
        {copied ? 'Copied' : 'Share'}
      </button>
      <span className="visually-hidden" aria-live="polite">{copied ? 'Link copied' : ''}</span>
    </div>
  )
}
