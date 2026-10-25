import { useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [seenLocation, setSeenLocation] = useState(location.key)
  const narrow = useSyncExternalStore(subscribeNarrow, narrowSnapshot, narrowServerSnapshot)
  const shellRef = useRef<HTMLElement>(null)

  if (seenLocation !== location.key) {
    setSeenLocation(location.key)
    setMobileOpen(false)
  }

  if (!narrow && mobileOpen) setMobileOpen(false)

  useLayoutEffect(() => {
    const shell = shellRef.current
    const header = shell?.querySelector<HTMLElement>('.topbar')
    if (!shell || !header) return
    const apply = () => {
      const rect = header.getBoundingClientRect()
      const block = Math.ceil(Math.max(rect.height, rect.bottom))
      if (block <= 0) return
      const next = `${block}px`
      if (shell.style.getPropertyValue('--fixed-nav-block-size') !== next) {
        shell.style.setProperty('--fixed-nav-block-size', next)
      }
    }
    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  const drawer = narrow && mobileOpen
  const shellClass = [
    'blog-shell',
    'admin-center',
    collapsed ? 'admin-center--collapsed' : '',
    drawer ? 'admin-center--drawer' : '',
  ].filter(Boolean).join(' ')

  return (
    <AdminNavContext.Provider value={{ mobileOpen, setMobileOpen, collapsed, setCollapsed, narrow }}>
      <main className={shellClass} ref={shellRef}>
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
