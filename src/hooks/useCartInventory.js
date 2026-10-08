import { useEffect, useState } from 'react'
import { usePrototype } from './usePrototype'
import { api, apiError } from '../utils/api'
export function useCartInventory() {
  const { cart, rememberProducts } = usePrototype()
  const key = cart
    .map((line) => line.id)
    .sort()
    .join(',')
  const [result, setResult] = useState({ key: '', loading: false, error: '' })
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!key) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setResult({ key, loading: true, error: '' })
      try {
        const products = await Promise.all(
          key.split(',').map(async (id) => {
            try {
              return (
                await api.get(`/products/${encodeURIComponent(id)}`, {
                  signal: controller.signal,
                })
              ).data.data
            } catch (e) {
              if (e.response?.status === 404) return { id, isActive: false }
              throw e
            }
          }),
        )
        if (!controller.signal.aborted) {
          rememberProducts(products)
          setResult({ key, loading: false, error: '' })
        }
      } catch (e) {
        if (e.code !== 'ERR_CANCELED')
          setResult({ key, loading: false, error: apiError(e) })
      }
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [key, revision, rememberProducts])
  return {
    ...(key && result.key !== key ? { loading: true, error: '' } : result),
    retry: () => setRevision((value) => value + 1),
  }
}
