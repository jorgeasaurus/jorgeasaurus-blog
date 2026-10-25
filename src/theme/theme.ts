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
  try {
    const match = document.cookie.match(/(?:^|; )blog-theme=(admin|classic)(?:;|$)/)
    return match ? (match[1] as BlogTheme) : 'classic'
  } catch {
    return 'classic'
  }
}

// Query, then the selection already applied in this document, then storage.
// A blocked storage write must not send client-side navigation back to Classic.
export function resolveTheme(search: string): BlogTheme {
  const requested = themeFromSearch(search)
  if (requested) return requested
  if (isBlogTheme(window.__BLOG_THEME__)) return window.__BLOG_THEME__
  return readStoredTheme()
}

export function writeStoredTheme(theme: BlogTheme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Ignore storage failures and still set the cookie below.
  }
  try {
    document.cookie = `${THEME_STORAGE_KEY}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`
  } catch {
    // Cookie access can throw SecurityError. Selection still has to proceed.
  }
}

export function applyTheme(theme: BlogTheme) {
  document.documentElement.dataset.theme = theme
  window.__BLOG_THEME__ = theme
}
