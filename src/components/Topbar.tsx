import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import SocialIcon from './SocialIcon'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'

const menuId = 'primary-menu'

export default function Topbar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [openPath, setOpenPath] = useState(pathname)
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 840px)').matches
  )
  if (openPath !== pathname) {
    setOpenPath(pathname)
    setOpen(false)
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
    const media = window.matchMedia('(max-width: 840px)')
    const apply = () => {
      setCompact(media.matches)
      if (!media.matches) setOpen(false)
    }
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
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
      setOpen(false)
      nav.querySelector<HTMLButtonElement>('.nav-toggle')?.focus()
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
    if ((event.target as Element).closest('a')) setOpen(false)
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
        onClick={closeFromLink}
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
