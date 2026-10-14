const key = 'tcg404.theme'
const normalize = (value) => value === 'light' ? 'light' : 'dark'

function apply(theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f6f3ed' : '#15161b')
}

export function initializeTheme() {
  let theme = 'dark'
  try { theme = normalize(window.localStorage.getItem(key)) } catch { /* Storage may be disabled. */ }
  apply(theme)
}

export const getTheme = () => document.documentElement.dataset.theme || 'dark'

export function setTheme(theme) {
  if (!['light', 'dark'].includes(theme)) return
  apply(theme)
  try { window.localStorage.setItem(key, theme) } catch { /* Keep the choice for this page. */ }
  window.dispatchEvent(new Event('tcg404:theme'))
}

export function subscribeTheme(listener) {
  const storage = (event) => {
    if (event.key === key || event.key === null) {
      apply(normalize(event.newValue))
      listener()
    }
  }
  window.addEventListener('tcg404:theme', listener)
  window.addEventListener('storage', storage)
  return () => {
    window.removeEventListener('tcg404:theme', listener)
    window.removeEventListener('storage', storage)
  }
}
