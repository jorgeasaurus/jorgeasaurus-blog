import { Link, useLocation } from 'react-router-dom'

export default function Topbar() {
  const { pathname } = useLocation()

  return (
    <nav className="topbar glass-panel" style={{ gridArea: 'topbar' }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="brand-mark" />
        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>Jorgeasaurus</span>
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
      </div>
    </nav>
  )
}
