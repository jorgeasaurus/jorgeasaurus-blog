import { createContext, use } from 'react'

export const narrowQuery = '(max-width: 900px)'

export interface AdminNavState {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  narrow: boolean
}

export const AdminNavContext = createContext<AdminNavState | null>(null)

export function useAdminNav() {
  const value = use(AdminNavContext)
  if (!value) {
    throw new Error('Admin navigation is unavailable outside the admin shell')
  }
  return value
}
