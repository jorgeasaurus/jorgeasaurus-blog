import { useCallback, useEffect, useMemo, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { applyTheme, resolveTheme, themeFromSearch, writeStoredTheme, type BlogTheme } from './theme'
import { ThemeContext } from './themeContext'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const search = searchParams.toString()
  const urlTheme = themeFromSearch(search)
  const theme = resolveTheme(search)

  if (document.documentElement.dataset.theme !== theme) applyTheme(theme)

  useEffect(() => {
    if (urlTheme) writeStoredTheme(urlTheme)
    applyTheme(theme)
  }, [theme, urlTheme])

  const setTheme = useCallback((next: BlogTheme) => {
    writeStoredTheme(next)
    applyTheme(next)
    const live = window.location
    const params = new URLSearchParams(live.search)
    params.set('theme', next)
    navigate(
      { pathname: live.pathname, search: params.toString(), hash: live.hash },
      { replace: true },
    )
  }, [navigate])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])
  return <ThemeContext value={value}>{children}</ThemeContext>
}
