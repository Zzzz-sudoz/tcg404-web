import Icon from './Icon'
import { useColorMode } from '../../hooks/useColorMode'
import { setTheme } from '../../utils/theme'

export default function ThemeToggle({ className = '' }) {
  const mode = useColorMode()
  const toggle = () => {
    const update = () => setTheme(mode === 'dark' ? 'light' : 'dark')
    if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.startViewTransition(update).finished.catch(() => {})
    } else update()
  }
  return (
    <button type="button" role="switch" aria-label="Dark mode" aria-checked={mode === 'dark'}
      title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      className={`theme-toggle ${className}`} onClick={toggle}>
      <span className="theme-toggle-track" aria-hidden="true">
        <Icon name="sun" className="theme-sun" />
        <Icon name="moon" className="theme-moon" />
        <span className="theme-toggle-thumb"><Icon name={mode === 'dark' ? 'moon' : 'sun'} /></span>
      </span>
    </button>
  )
}
