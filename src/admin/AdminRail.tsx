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
  const lastFocusInside = useRef(false)
  const onHome = pathname === '/'

  function isPlainClick(event: MouseEvent<HTMLAnchorElement>) {
    return event.button === 0
      && !event.metaKey
      && !event.ctrlKey
      && !event.shiftKey
      && !event.altKey
  }

  function scrollHomeToTop(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname !== '/' || !isPlainClick(event)) return
    window.scrollTo(0, 0)
  }

  function closeDrawer(event: MouseEvent<HTMLAnchorElement>) {
    if (!narrow || !isPlainClick(event)) return
    setMobileOpen(false)
  }

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const onFocusIn = () => { lastFocusInside.current = true }
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget
      if (next instanceof Node && !rail.contains(next)) lastFocusInside.current = false
    }
    rail.addEventListener('focusin', onFocusIn)
    rail.addEventListener('focusout', onFocusOut)
    return () => {
      rail.removeEventListener('focusin', onFocusIn)
      rail.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  useEffect(() => {
    if (!narrow || !lastFocusInside.current) return
    const rail = railRef.current
    const active = document.activeElement
    const displaced = !active || active === document.body || Boolean(rail?.contains(active))
    if (!displaced) {
      lastFocusInside.current = false
      return
    }
    lastFocusInside.current = false
    const toggle = document.querySelector<HTMLElement>('.ac-nav-toggle')
    if (toggle && getComputedStyle(toggle).display !== 'none') toggle.focus({ preventScroll: true })
  }, [narrow])

  useEffect(() => {
    const rail = railRef.current
    if (!mobileOpen || !narrow || !rail) return

    const focusable = () => [...rail.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
      .filter((element) => element.tabIndex >= 0 && getComputedStyle(element).display !== 'none')

    const focusItem = (element: HTMLElement) => {
      element.focus({ preventScroll: true })
      const scroller = element.closest<HTMLElement>('.ac-rail-scroll')
      if (!scroller || !rail.contains(scroller)) return
      const view = scroller.getBoundingClientRect()
      const box = element.getBoundingClientRect()
      if (box.top < view.top) scroller.scrollTop -= view.top - box.top + 6
      else if (box.bottom > view.bottom) scroller.scrollTop += box.bottom - view.bottom + 6
    }

    const openedAt = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const items = focusable()
    if (items[0]) focusItem(items[0])

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
          focusItem(last)
        }
        return
      }
      if (!inside || active === last) {
        event.preventDefault()
        focusItem(first)
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
        <RailLink
          to="/"
          icon="home"
          label="Home"
          current={onHome && !category && hash === ''}
          onClick={(event) => {
            scrollHomeToTop(event)
            closeDrawer(event)
          }}
        />
        <RailLink to="/#overview" icon="grid" label="Dashboard" current={onHome && hash === '#overview'} onClick={closeDrawer} />
        <RailLink to="/#posts" icon="list" label="All posts" current={onHome && hash === '#posts'} onClick={closeDrawer} />
        <p className="ac-rail-section">Topics</p>
        {topicBlades.map((blade) => (
          <RailLink
            key={blade.slug}
            to={listingPath({ category: blade.slug })}
            icon={blade.icon}
            label={blade.label}
            hint={blade.hint}
            current={category === blade.slug}
            onClick={closeDrawer}
          />
        ))}
        <p className="ac-rail-section">More</p>
        <RailLink to="/about" icon="info" label="About" current={pathname === '/about'} onClick={closeDrawer} />
        <RailLink to="/projects" icon="folder" label="Projects" current={pathname === '/projects'} onClick={closeDrawer} />
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
