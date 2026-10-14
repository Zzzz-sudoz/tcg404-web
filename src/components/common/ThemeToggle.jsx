import Icon from './Icon'
import { useColorMode } from '../../hooks/useColorMode'
import { setTheme } from '../../utils/theme'

export default function ThemeToggle({ className = '' }) {
  const mode = useColorMode()
  const toggle = () => {
    setTheme(mode === 'dark' ? 'light' : 'dark')
  }
  return (
    <button type="button" role="switch" aria-label="Dark mode" aria-checked={mode === 'dark'}
      title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      className={`theme-toggle ${className}`} onClick={toggle}>
      <span className="theme-toggle-track" aria-hidden="true">
        <svg className="theme-sky" viewBox="0 0 96 40" fill="none">
          <path className="theme-clouds" d="M45 13h16a4 4 0 0 0-1-8 5 5 0 0 0-9 0 4 4 0 0 0-6 8ZM61 29h19a4 4 0 0 0-2-8 5 5 0 0 0-9-1 5 5 0 0 0-8 9Z" fill="currentColor" />
          <g className="theme-stars" fill="currentColor"><path d="m15 9 1 3 3 1-3 1-1 3-1-3-3-1 3-1Zm22 13 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z"/><circle cx="31" cy="9" r="1"/><circle cx="48" cy="16" r="1"/><circle cx="21" cy="29" r="1"/></g>
        </svg>
        <span className="theme-toggle-thumb"><Icon name="sun" className="theme-thumb-sun" /><Icon name="moon" className="theme-thumb-moon" /></span>
      </span>
    </button>
  )
}
