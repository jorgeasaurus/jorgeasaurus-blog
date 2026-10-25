import type { MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAdminNav } from './adminNavContext'
import AdminIcon from './icons'
import SocialIcon from '../components/SocialIcon'
import ThemeSwitcher from '../theme/ThemeSwitcher'

export default function AdminTopbar() {
  const { pathname } = useLocation()
  const { mobileOpen, setMobileOpen } = useAdminNav()

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

  return (
    <nav className="topbar" aria-label="Primary navigation">
      <Link to="/" className="brand-link" aria-label="Jorgeasaurus" onClick={scrollListingToTop}>
        <span className="ac-mark" aria-hidden="true">J</span>
        <span className="brand-name">jorgeasaurus admin center</span>
      </Link>
      <ThemeSwitcher />
      <button
        className="ac-nav-toggle"
        type="button"
        aria-expanded={mobileOpen}
        aria-controls="admin-rail"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <AdminIcon name={mobileOpen ? 'dismiss' : 'menu'} />
        <span className="visually-hidden">{mobileOpen ? 'Close navigation' : 'Open navigation'}</span>
      </button>
      <div className="topbar-links">
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
