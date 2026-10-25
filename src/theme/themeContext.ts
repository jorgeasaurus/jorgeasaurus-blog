import { createContext, use } from 'react'
import type { BlogTheme } from './theme'

export interface ThemeContextValue {
  theme: BlogTheme
  setTheme: (theme: BlogTheme) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const value = use(ThemeContext)
  if (!value) throw new Error('useTheme must be used within ThemeProvider')
  return value
}
