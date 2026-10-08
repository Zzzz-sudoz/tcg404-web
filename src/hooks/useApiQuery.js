import { useEffect, useState } from 'react'
import { readApi, apiError } from '../utils/api'
export function useApiQuery(path, query = '', revision = 0) {
  const key = `${path}?${query}:${revision}`
  const [result, setResult] = useState({
    data: [],
    meta: {},
    loading: true,
    error: '',
  })
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(
      () => {
        setResult((current) => ({ ...current, loading: true, error: '' }))
        readApi(path, query, controller.signal, revision > 0)
          .then(({ data }) => {
            if (!controller.signal.aborted)
              setResult({
                key,
                data: data.data,
                meta: data.meta || {},
                loading: false,
                error: '',
              })
          })
          .catch((e) => {
            if (!controller.signal.aborted && e.code !== 'ERR_CANCELED')
              setResult({
                key,
                data: [],
                meta: {},
                loading: false,
                error: apiError(e),
                status: e.response?.status,
              })
          })
      },
      query.includes('search=') ? 300 : 0,
    )
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [path, query, revision, key])
  return result.key === key
    ? result
    : { data: [], meta: {}, loading: true, error: '' }
}
