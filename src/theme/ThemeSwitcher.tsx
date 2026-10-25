import { useTheme } from './themeContext'
import type { BlogTheme } from './theme'

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <label className="theme-switch">
      <span className="theme-switch__label">Theme</span>
      <select
        value={theme}
        onChange={(event) => {
          const next = event.target.value
          if (next === 'classic' || next === 'admin') setTheme(next as BlogTheme)
        }}
      >
        <option value="classic">Classic</option>
        <option value="admin">Admin center</option>
      </select>
    </label>
  )
}
