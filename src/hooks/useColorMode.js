import { useSyncExternalStore } from 'react'
import { getTheme, subscribeTheme } from '../utils/theme'

export function useColorMode() {
  return useSyncExternalStore(subscribeTheme, getTheme, () => 'dark')
}
