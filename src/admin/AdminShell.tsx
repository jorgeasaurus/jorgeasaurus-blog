import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import BackdropCredit from '../components/BackdropCredit'
import AdminTopbar from './AdminTopbar'
import WallpaperStage from '../components/WallpaperStage'
import { AdminNavContext } from './adminNavContext'
import AdminRail from './AdminRail'

export default function AdminShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const locationKey = `${location.pathname}${location.search}${location.hash}`
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [seenLocation, setSeenLocation] = useState(locationKey)

  if (seenLocation !== locationKey) {
    setSeenLocation(locationKey)
    setMobileOpen(false)
  }

  const shellClass = [
    'blog-shell',
    'admin-center',
    collapsed ? 'admin-center--collapsed' : '',
    mobileOpen ? 'admin-center--drawer' : '',
  ].filter(Boolean).join(' ')

  return (
    <AdminNavContext.Provider value={{ mobileOpen, setMobileOpen, collapsed, setCollapsed }}>
      <main className={shellClass}>
        <WallpaperStage />
        <AdminTopbar />
        <AdminRail />
        {mobileOpen && (
          <button
            className="ac-overlay"
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <div className="ac-canvas">{children}</div>
        <p className="ac-homage">
          Unofficial homage to the Intune admin center layout. Not affiliated with Microsoft.
        </p>
        <BackdropCredit />
      </main>
    </AdminNavContext.Provider>
  )
}
