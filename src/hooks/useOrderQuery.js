import { useCallback, useEffect, useState } from 'react'
import { readApi, apiError } from '../utils/api'
import { watchVisibleOrders } from '../utils/orderHistory'

export function useOrderQuery(path, query = '', admin = false) {
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision((value) => value + 1), [])
  const key = `${path}?${query}${admin ? `:${revision}` : ''}`
  const [result, setResult] = useState({ data: [], meta: {}, loading: true, error: '' })

  useEffect(() => {
    if (!admin) return watchVisibleOrders(refresh)
  }, [admin, refresh])

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setResult((current) => current.key === key
        ? { ...current, refreshing: true, refreshError: '' }
        : { data: [], meta: {}, loading: true, error: '' })
      readApi(path, query, controller.signal, revision > 0)
        .then(({ data }) => {
          if (!controller.signal.aborted)
            setResult({ key, data: data.data, meta: data.meta || {}, loading: false, error: '' })
        })
        .catch((error) => {
          if (controller.signal.aborted || error.code === 'ERR_CANCELED') return
          setResult((current) => current.key === key && !current.error
            ? { ...current, refreshing: false, refreshError: apiError(error) }
            : { key, data: [], meta: {}, loading: false, error: apiError(error) })
        })
    }, query.includes('search=') ? 300 : 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [path, query, revision, key])

  return { ...(result.key === key ? result : { data: [], meta: {}, loading: true, error: '' }), refresh }
}
