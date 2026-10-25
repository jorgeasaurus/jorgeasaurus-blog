import { useState, useSyncExternalStore, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import BackdropCredit from '../components/BackdropCredit'
import AdminTopbar from './AdminTopbar'
import WallpaperStage from '../components/WallpaperStage'
import { AdminNavContext, narrowQuery } from './adminNavContext'
import AdminRail from './AdminRail'

function subscribeNarrow(onChange: () => void) {
  const media = window.matchMedia(narrowQuery)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function narrowSnapshot() {
  return window.matchMedia(narrowQuery).matches
}

function narrowServerSnapshot() {
  return false
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const locationKey = `${location.pathname}${location.search}${location.hash}`
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [seenLocation, setSeenLocation] = useState(locationKey)
  const narrow = useSyncExternalStore(subscribeNarrow, narrowSnapshot, narrowServerSnapshot)

  if (seenLocation !== locationKey) {
    setSeenLocation(locationKey)
    setMobileOpen(false)
  }

  if (!narrow && mobileOpen) setMobileOpen(false)

  const drawer = narrow && mobileOpen
  const shellClass = [
    'blog-shell',
    'admin-center',
    collapsed ? 'admin-center--collapsed' : '',
    drawer ? 'admin-center--drawer' : '',
  ].filter(Boolean).join(' ')

  return (
    <AdminNavContext.Provider value={{ mobileOpen, setMobileOpen, collapsed, setCollapsed, narrow }}>
      <main className={shellClass}>
        <WallpaperStage />
        <AdminTopbar />
        <AdminRail />
        {drawer && (
          <button
            className="ac-overlay"
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <div className="ac-canvas" inert={drawer ? true : undefined}>{children}</div>
        <p className="ac-homage" inert={drawer ? true : undefined}>
          Unofficial homage to the Intune admin center layout. Not affiliated with Microsoft.
        </p>
        <div inert={drawer ? true : undefined}>
          <BackdropCredit />
        </div>
      </main>
    </AdminNavContext.Provider>
  )
}
