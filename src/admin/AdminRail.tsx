import { useEffect, useRef, type MouseEvent } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { listingPath } from '../lib/postSearch.mjs'
import { useAdminNav } from './adminNavContext'
import { topicBlades } from './blades'
import AdminIcon from './icons'
import type { IconName } from './icons'

function RailLink({
  to,
  icon,
  label,
  hint,
  current,
  external,
  native,
  onClick,
}: {
  to: string
  icon: IconName
  label: string
  hint?: string
  current?: boolean
  external?: boolean
  native?: boolean
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}) {
  const className = current ? 'ac-rail-link ac-rail-link--active' : 'ac-rail-link'
  const body = (
    <>
      <AdminIcon name={icon} />
      <span className="ac-rail-copy">
        <span className="ac-rail-label">{label}</span>
        {hint && <span className="ac-rail-hint">{hint}</span>}
      </span>
    </>
  )

  if (external || native) {
    return (
      <a
        className={className}
        href={to}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
      >
        {body}
      </a>
    )
  }

  return (
    <Link className={className} to={to} aria-current={current ? 'page' : undefined} onClick={onClick}>
      {body}
    </Link>
  )
}

export default function AdminRail() {
  const { mobileOpen, setMobileOpen, collapsed, setCollapsed, narrow } = useAdminNav()
  const [searchParams] = useSearchParams()
  const { pathname, hash } = useLocation()
  const category = searchParams.get('category') ?? ''
  const railRef = useRef<HTMLElement>(null)
  const onHome = pathname === '/'

  function scrollHomeToTop(event: MouseEvent<HTMLAnchorElement>) {
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

  useEffect(() => {
    const rail = railRef.current
    if (!mobileOpen || !narrow || !rail) return

    const focusable = () => [...rail.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
      .filter((element) => element.tabIndex >= 0 && getComputedStyle(element).display !== 'none')

    const openedAt = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const items = focusable()
    items[0]?.focus({ preventScroll: true })

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMobileOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const list = focusable()
      if (list.length === 0) return
      const first = list[0]
      const last = list[list.length - 1]
      const active = document.activeElement
      const inside = active instanceof Node && rail.contains(active)
      if (event.shiftKey) {
        if (!inside || active === first) {
          event.preventDefault()
          last.focus({ preventScroll: true })
        }
        return
      }
      if (!inside || active === last) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      const here = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (here !== openedAt) return
      const toggle = document.querySelector<HTMLElement>('.ac-nav-toggle')
      if (toggle && getComputedStyle(toggle).display !== 'none') toggle.focus({ preventScroll: true })
    }
  }, [mobileOpen, narrow, setMobileOpen])

  return (
    <nav
      id="admin-rail"
      ref={railRef}
      className="ac-rail"
      aria-label="Admin center"
      inert={narrow && !mobileOpen ? true : undefined}
    >
      <div className="ac-rail-scroll">
        <RailLink to="/" icon="home" label="Home" current={onHome && !category && hash === ''} onClick={scrollHomeToTop} />
        <RailLink to="/#overview" icon="grid" label="Dashboard" current={onHome && hash === '#overview'} />
        <RailLink to="/#posts" icon="list" label="All posts" current={onHome && hash === '#posts'} />
        <p className="ac-rail-section">Topics</p>
        {topicBlades.map((blade) => (
          <RailLink
            key={blade.slug}
            to={listingPath({ category: blade.slug })}
            icon={blade.icon}
            label={blade.label}
            hint={blade.hint}
            current={category === blade.slug}
          />
        ))}
        <p className="ac-rail-section">More</p>
        <RailLink to="/about" icon="info" label="About" current={pathname === '/about'} />
        <RailLink to="/projects" icon="folder" label="Projects" current={pathname === '/projects'} />
        <RailLink to="/rss.xml" icon="rss" label="RSS" native />
        <RailLink to="https://www.youtube.com/@jorgeasaurus" icon="play" label="YouTube" external />
      </div>
      <button
        className="ac-rail-collapse"
        type="button"
        aria-pressed={narrow ? undefined : collapsed}
        onClick={() => {
          if (narrow) {
            setMobileOpen(false)
            return
          }
          setCollapsed(!collapsed)
        }}
      >
        <AdminIcon name={collapsed && !narrow ? 'panel' : 'chevron'} />
        <span>{narrow ? 'Close navigation' : collapsed ? 'Expand navigation' : 'Collapse navigation'}</span>
      </button>
    </nav>
  )
}
