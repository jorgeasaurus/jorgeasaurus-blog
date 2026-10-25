import { useLayoutEffect, useRef } from 'react'
import { useTheme } from './themeContext'

let restoreThemeFocus = false

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const selectRef = useRef<HTMLSelectElement>(null)

  useLayoutEffect(() => {
    if (!restoreThemeFocus) return
    restoreThemeFocus = false
    selectRef.current?.focus({ preventScroll: true })
  }, [theme])

  return (
    <label className="theme-switch">
      <span className="theme-switch__label">Theme</span>
      <select
        ref={selectRef}
        value={theme}
        onChange={(event) => {
          const next = event.target.value
          if (next !== 'classic' && next !== 'admin') return
          if (next !== theme) restoreThemeFocus = true
          setTheme(next)
        }}
      >
        <option value="classic">Classic</option>
        <option value="admin">Admin center</option>
      </select>
    </label>
  )
}
