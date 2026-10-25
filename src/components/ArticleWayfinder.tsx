import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { scrollHeadingIntoView, type ArticleHeading } from '../lib/headings'
import { IconChevron } from './Icons'

const wideQuery = '(min-width: 1040px)'

function subscribe(onStoreChange: () => void) {
  const media = window.matchMedia(wideQuery)
  media.addEventListener('change', onStoreChange)
  return () => media.removeEventListener('change', onStoreChange)
}

function wideSnapshot() {
  return window.matchMedia(wideQuery).matches
}

interface ArticleWayfinderProps {
  outline: ArticleHeading[]
}

export default function ArticleWayfinder({ outline }: ArticleWayfinderProps) {
  const wide = useSyncExternalStore(subscribe, wideSnapshot, () => false)
  const [open, setOpen] = useState(false)
  const [activeId, setActiveId] = useState('')
  const pendingJump = useRef<string | null>(null)
  const expanded = wide || open
  const finishJump = useCallback((id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    scrollHeadingIntoView(target, reduced ? 'auto' : 'smooth')
    target.focus({ preventScroll: true })
    const next = new URL(window.location.href)
    next.hash = id
    window.history.replaceState(window.history.state, '', `${next.pathname}${next.search}${next.hash}`)
    setActiveId(id)
  }, [])

  useLayoutEffect(() => {
    const id = pendingJump.current
    if (!id || open) return
    pendingJump.current = null
    finishJump(id)
  }, [finishJump, open])
  const currentId = outline.some((item) => item.id === activeId) ? activeId : outline[0]?.id ?? ''
  const current = outline.find((item) => item.id === currentId)

  useEffect(() => {
    const nodes = outline
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node))
    if (nodes.length === 0) return

    const visible = new Set<string>()
    let observer: IntersectionObserver | null = null
    let frame = 0

    const syncActive = () => {
      frame = 0
      const intersecting = nodes
        .filter((node) => visible.has(node.id))
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
      if (intersecting[0]) {
        setActiveId(intersecting[0].id)
        return
      }
      const line = Math.min(180, window.innerHeight * 0.34)
      let passed = nodes[0]
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= line) passed = node
      }
      setActiveId(passed.id)
    }

    const requestSync = () => {
      if (frame) return
      frame = window.requestAnimationFrame(syncActive)
    }

    const connect = () => {
      observer?.disconnect()
      visible.clear()
      const height = window.innerHeight
      const top = Math.round(height * 0.12)
      const bottom = Math.round(height * 0.68)
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id)
          else visible.delete(entry.target.id)
        }
        requestSync()
      }, {
        rootMargin: `-${top}px 0px -${bottom}px 0px`,
        threshold: [0, 0.2, 1],
      })
      for (const node of nodes) observer.observe(node)
      requestSync()
    }

    connect()
    window.addEventListener('resize', connect)
    window.addEventListener('scroll', requestSync, { passive: true })
    return () => {
      observer?.disconnect()
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', connect)
      window.removeEventListener('scroll', requestSync)
    }
  }, [outline])

  if (outline.length < 2) return null

  function jump(id: string) {
    if (!document.getElementById(id)) return
    if (!wide && open) {
      pendingJump.current = id
      setOpen(false)
      return
    }
    finishJump(id)
    if (!wide) setOpen(false)
  }

  return (
    <nav className={`wayfinder frosted${wide ? ' wayfinder--dock' : ''}`} aria-label="On this page">
      {wide ? (
        <p className="wayfinder__label">On this page</p>
      ) : (
        <button
          className="wayfinder__toggle"
          type="button"
          aria-expanded={expanded}
          aria-controls="on-this-page-list"
          onClick={() => setOpen((value) => !value)}
        >
          <span>On this page</span>
          {current && <span className="wayfinder__current">{current.text}</span>}
          <IconChevron className={`icon wayfinder__chevron${expanded ? ' wayfinder__chevron--open' : ''}`} />
        </button>
      )}
      <ol id="on-this-page-list" className="wayfinder__list" hidden={!expanded}>
        {outline.map((item) => (
          <li
            key={item.id}
            className={item.level === 3 ? 'wayfinder__item wayfinder__item--nested' : 'wayfinder__item'}
          >
            <a
              href={`#${item.id}`}
              aria-current={item.id === currentId ? 'location' : undefined}
              onClick={(event) => {
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                ) return
                event.preventDefault()
                jump(item.id)
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
