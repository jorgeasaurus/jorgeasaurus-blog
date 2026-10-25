import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { applyTheme, readStoredTheme, themeFromSearch, writeStoredTheme, type BlogTheme } from './theme'
import { ThemeContext } from './themeContext'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlTheme = themeFromSearch(searchParams.toString())
  const theme = urlTheme ?? readStoredTheme()

  if (document.documentElement.dataset.theme !== theme) applyTheme(theme)

  useEffect(() => {
    if (urlTheme) writeStoredTheme(urlTheme)
    applyTheme(theme)
  }, [theme, urlTheme])

  const setTheme = useCallback((next: BlogTheme) => {
    writeStoredTheme(next)
    applyTheme(next)
    setSearchParams((current) => {
      const params = new URLSearchParams(current)
      params.set('theme', next)
      return params
    }, { replace: true })
  }, [setSearchParams])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext value={value}>{children}</ThemeContext>
}
