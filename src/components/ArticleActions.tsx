import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconLink, IconUp } from './Icons'
import { copyText } from '../lib/copyText'

export default function ArticleActions() {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copyLink() {
    const ok = await copyText(window.location.href)
    if (!ok) return
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 2000)
  }

  function backToTop() {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <div className="article-actions" role="group" aria-label="Article actions">
      <button className="article-action" type="button" aria-label="Copy link" onClick={() => { void copyLink() }}>
        {copied ? <IconCheck /> : <IconLink />}
        <span>{copied ? 'Copied' : 'Copy link'}</span>
      </button>
      <button className="article-action" type="button" onClick={backToTop}>
        <IconUp />
        <span>Back to top</span>
      </button>
      <span className="visually-hidden" aria-live="polite">{copied ? 'Copied' : ''}</span>
    </div>
  )
}
