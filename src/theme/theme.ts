export const THEME_STORAGE_KEY = 'blog-theme'

export type BlogTheme = 'classic' | 'admin'

export function isBlogTheme(value: string | null | undefined): value is BlogTheme {
  return value === 'classic' || value === 'admin'
}

export function themeFromSearch(search: string): BlogTheme | null {
  const requested = new URLSearchParams(search).get('theme')
  return isBlogTheme(requested) ? requested : null
}

export function readStoredTheme(): BlogTheme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (isBlogTheme(stored)) return stored
  } catch {
    // Storage can throw in private browsing. The cookie is the fallback.
  }
  const match = document.cookie.match(/(?:^|; )blog-theme=(admin|classic)(?:;|$)/)
  return match ? (match[1] as BlogTheme) : 'classic'
}

export function writeStoredTheme(theme: BlogTheme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore storage failures and still set the cookie below.
  }
  document.cookie = `${THEME_STORAGE_KEY}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`
}

export function applyTheme(theme: BlogTheme) {
  document.documentElement.dataset.theme = theme
  window.__BLOG_THEME__ = theme
}
