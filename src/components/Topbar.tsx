import { Link, useLocation } from 'react-router-dom'
import SocialIcon from './SocialIcon'

export default function Topbar() {
  const { pathname } = useLocation()

  return (
    <nav className="topbar glass-panel">
      <Link to="/" className="brand-link">
        <div className="brand-mark" />
        <span className="brand-name">&gt; Jorgeasaurus</span>
      </Link>
      <div className="topbar-links">
        <Link
          to="/"
          className={`nav-link ${pathname === '/' ? 'nav-link--active' : ''}`}
        >
          Home
        </Link>
        <Link
          to="/about"
          className={`nav-link ${pathname === '/about' ? 'nav-link--active' : ''}`}
        >
          About
        </Link>
        <a
          href="https://github.com/jorgeasaurus"
          className="nav-link nav-link--icon"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <SocialIcon name="github" />
          <span>GitHub</span>
        </a>
        <a
          href="https://www.linkedin.com/in/jorgeasaurus/"
          className="nav-link nav-link--icon"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
        >
          <SocialIcon name="linkedin" />
          <span>LinkedIn</span>
        </a>
      </div>
    </nav>
  )
}
