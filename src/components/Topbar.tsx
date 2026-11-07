import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SocialIcon from './SocialIcon'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'

const menuId = 'primary-menu'
const compactQuery = '(max-width: 840px)'
let focusMenuAfterNavigation = false

export default function Topbar() {
  const location = useLocation()
  const { pathname } = location
  const [open, setOpen] = useState(false)
  const [seenKey, setSeenKey] = useState(location.key)
  const [focusGeneration, setFocusGeneration] = useState(0)
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(compactQuery).matches
  )
  if (seenKey !== location.key) {
    const shouldRestore = open
    setSeenKey(location.key)
    setOpen(false)
    if (shouldRestore) setFocusGeneration(focusGeneration + 1)
  }
  const navRef = useRef<HTMLElement | null>(null)
  const glassRef = useLiquidGlassSurface<HTMLElement>({
    borderRadius: 999,
    type: 'pill',
  })
  const setNav = useCallback((node: HTMLElement | null) => {
    navRef.current = node
    if (typeof glassRef === 'function') glassRef(node)
  }, [glassRef])

  useEffect(() => {
    if (!focusMenuAfterNavigation) return
    focusMenuAfterNavigation = false
    if (!window.matchMedia(compactQuery).matches) return
    const nav = navRef.current
    requestAnimationFrame(() => {
      nav?.querySelector<HTMLButtonElement>('.nav-toggle')?.focus()
    })
  }, [])

  useEffect(() => {
    if (focusGeneration === 0) return
    const nav = navRef.current
    if (!nav || !window.matchMedia(compactQuery).matches) return
    const active = document.activeElement
    if (active instanceof HTMLElement && !nav.contains(active)) return
    requestAnimationFrame(() => {
      nav.querySelector<HTMLButtonElement>('.nav-toggle')?.focus()
    })
  }, [focusGeneration])

  useEffect(() => {
    const media = window.matchMedia(compactQuery)
    const nav = navRef.current
    const lastNavFocus = { current: null as HTMLElement | null }
    const remember = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement) lastNavFocus.current = event.target
    }
    nav?.addEventListener('focusin', remember)
    const apply = () => {
      const next = media.matches
      const bar = navRef.current
      const active = document.activeElement
      const candidate = active instanceof HTMLElement && bar?.contains(active)
        ? active
        : lastNavFocus.current
      setCompact(next)
      if (!next) setOpen(false)
      if (!bar || !(candidate instanceof HTMLElement) || !bar.contains(candidate)) return
      const moveToMenu = next && Boolean(candidate.closest(`#${menuId}`))
      const moveToLink = !next && candidate.classList.contains('nav-toggle')
      if (!moveToMenu && !moveToLink) return
      requestAnimationFrame(() => {
        const target = moveToMenu
          ? bar.querySelector<HTMLElement>('.nav-toggle')
          : bar.querySelector<HTMLElement>(`#${menuId} a`)
        target?.focus()
      })
    }
    media.addEventListener('change', apply)
    return () => {
      media.removeEventListener('change', apply)
      nav?.removeEventListener('focusin', remember)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      navRef.current?.querySelector<HTMLButtonElement>('.nav-toggle')?.focus()
    }
    function onPointer(event: PointerEvent) {
      const nav = navRef.current
      if (!nav || !(event.target instanceof Node) || nav.contains(event.target)) return
      const target = event.target instanceof Element ? event.target : null
      const takesFocus = Boolean(target?.closest('a, button, input, select, textarea, summary, [tabindex]:not([tabindex="-1"])'))
      setOpen(false)
      if (!takesFocus) nav.querySelector<HTMLButtonElement>('.nav-toggle')?.focus()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  function scrollListingToTop(event: MouseEvent<HTMLAnchorElement>) {
    if (
      pathname !== '/' ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return
    window.scrollTo(0, 0)
  }

  function closeFromLink(event: MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as Element).closest('a')
    if (!anchor) return
    setOpen(false)
    if (!compact) return
    const url = new URL(anchor.href, window.location.href)
    const clientRoute = anchor.target !== '_blank'
      && url.origin === window.location.origin
      && url.pathname !== window.location.pathname
    if (clientRoute) {
      focusMenuAfterNavigation = true
      return
    }
    const nav = navRef.current
    requestAnimationFrame(() => {
      nav?.querySelector<HTMLButtonElement>('.nav-toggle')?.focus()
    })
  }

  const name = pathname === '/'
    ? <h1 className="brand-name">Jorgeasaurus</h1>
    : <span className="brand-name">Jorgeasaurus</span>

  return (
    <nav className="topbar glass-panel" aria-label="Primary navigation" ref={setNav}>
      <Link to="/" className="brand-link" onClick={scrollListingToTop}>
        <span className="brand-prompt" aria-hidden="true">&gt;</span>
        {name}
      </Link>
      <button
        className="nav-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        Menu
      </button>
      <div
        id={menuId}
        className="topbar-links"
        hidden={compact && !open}
        onClickCapture={closeFromLink}
      >
        <Link
          to="/"
          className={`nav-link nav-link--home ${pathname === '/' ? 'nav-link--active' : ''}`}
          onClick={scrollListingToTop}
        >
          Home
        </Link>
        <Link
          to="/projects"
          className={`nav-link ${pathname === '/projects' ? 'nav-link--active' : ''}`}
        >
          Projects
        </Link>
        <Link
          to="/about"
          className={`nav-link ${pathname === '/about' ? 'nav-link--active' : ''}`}
        >
          About
        </Link>
        <div className="topbar-social">
          <a
            href="https://github.com/jorgeasaurus"
            className="nav-link nav-link--icon nav-link--social"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <SocialIcon name="github" />
            <span>GitHub</span>
          </a>
          <a
            href="https://www.linkedin.com/in/jorgeasaurus/"
            className="nav-link nav-link--icon nav-link--social"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
          >
            <SocialIcon name="linkedin" />
            <span>LinkedIn</span>
          </a>
          <a
            href="https://www.youtube.com/@jorgeasaurus"
            className="nav-link nav-link--icon nav-link--social"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
          >
            <SocialIcon name="youtube" />
            <span>YouTube</span>
          </a>
          <a
            href="/rss.xml"
            className="nav-link nav-link--icon nav-link--social"
            type="application/rss+xml"
            aria-label="RSS"
          >
            <SocialIcon name="rss" />
            <span>RSS</span>
          </a>
        </div>
      </div>
    </nav>
  )
}
