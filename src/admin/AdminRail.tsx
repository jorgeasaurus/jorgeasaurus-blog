import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { listingPath } from '../lib/postSearch.mjs'
import { useAdminNav } from './adminNavContext'
import { topicBlades } from './blades'
import AdminIcon from './icons'
import type { IconName } from './icons'

const narrowQuery = '(max-width: 900px)'

function RailLink({
  to,
  icon,
  label,
  hint,
  current,
  external,
}: {
  to: string
  icon: IconName
  label: string
  hint?: string
  current?: boolean
  external?: boolean
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

  if (external) {
    return (
      <a className={className} href={to} target="_blank" rel="noopener noreferrer">
        {body}
      </a>
    )
  }

  return (
    <Link className={className} to={to} aria-current={current ? 'page' : undefined}>
      {body}
    </Link>
  )
}

export default function AdminRail() {
  const { mobileOpen, setMobileOpen, collapsed, setCollapsed } = useAdminNav()
  const [searchParams] = useSearchParams()
  const { pathname, hash } = useLocation()
  const [narrow, setNarrow] = useState(false)
  const category = searchParams.get('category') ?? ''
  const railRef = useRef<HTMLElement>(null)
  const onHome = pathname === '/'

  useEffect(() => {
    const media = window.matchMedia(narrowQuery)
    const sync = () => setNarrow(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    railRef.current?.querySelector<HTMLElement>('a, button')?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen, setMobileOpen])

  return (
    <nav
      id="admin-rail"
      ref={railRef}
      className="ac-rail"
      aria-label="Admin center"
      inert={narrow && !mobileOpen ? true : undefined}
    >
      <div className="ac-rail-scroll">
        <RailLink to="/" icon="home" label="Home" current={onHome && !category && hash === ''} />
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
        <RailLink to="/rss.xml" icon="rss" label="RSS" />
        <RailLink to="https://www.youtube.com/@jorgeasaurus" icon="play" label="YouTube" external />
      </div>
      <button
        className="ac-rail-collapse"
        type="button"
        aria-pressed={narrow ? undefined : collapsed}
        onClick={() => {
          if (window.matchMedia(narrowQuery).matches) {
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
