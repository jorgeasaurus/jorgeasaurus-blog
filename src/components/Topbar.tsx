import { Link, useLocation } from 'react-router-dom'
import SocialIcon from './SocialIcon'

export default function Topbar() {
  const { pathname } = useLocation()

  return (
    <nav
      className="topbar glass-panel"
      style={{ gridArea: 'topbar' }}
    >
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="brand-mark" />
        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>&gt; Jorgeasaurus</span>
      </Link>
      <div style={{ display: 'flex', gap: 10 }}>
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
          className="nav-link"
          target="_blank"
          rel="noreferrer"
        >
          <SocialIcon name="github" />
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/jorgeasaurus/"
          className="nav-link"
          target="_blank"
          rel="noreferrer"
        >
          <SocialIcon name="linkedin" />
          LinkedIn
        </a>
      </div>
    </nav>
  )
}
