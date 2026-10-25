import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { applyTheme, readStoredTheme, themeFromSearch, writeStoredTheme, type BlogTheme } from './theme'
import { ThemeContext } from './themeContext'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
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
    const params = new URLSearchParams(location.search)
    params.set('theme', next)
    navigate(
      { pathname: location.pathname, search: params.toString(), hash: location.hash },
      { replace: true },
    )
  }, [location.hash, location.pathname, location.search, navigate])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext value={value}>{children}</ThemeContext>
}
