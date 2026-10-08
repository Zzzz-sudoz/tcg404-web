import axios from 'axios'
export const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || '/api',
  withCredentials: true,
})
export const apiError = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error?.message ||
  error.message ||
  'Request unavailable. Try again.'
export const apiFields = (error) =>
  error.response?.data?.error?.fields ||
  error.response?.data?.fields ||
  error.response?.data?.errors ||
  {}
const productReads = new Map()
let productGeneration = 0
export function readApi(path, query, signal, refresh = false) {
  const params = new URLSearchParams(query)
  if (!/^\/products(?:\/[^/]+)?$/.test(path) || params.has('includeArchived'))
    return api.get(path, { params, signal })
  params.sort()
  const key = path + '?' + params.toString()
  const cached = productReads.get(key)
  if (
    !refresh &&
    cached &&
    (cached.pending || Date.now() - cached.time < 10000)
  )
    return cached.promise
  const generation = productGeneration
  const entry = { pending: true, time: 0 }
  entry.promise = api.get(path, { params }).then(
    (response) => {
      entry.pending = false
      entry.time = Date.now()
      if (generation !== productGeneration && productReads.get(key) === entry)
        productReads.delete(key)
      return response
    },
    (error) => {
      if (productReads.get(key) === entry) productReads.delete(key)
      throw error
    },
  )
  if (productReads.size >= 64)
    productReads.delete(productReads.keys().next().value)
  productReads.set(key, entry)
  return entry.promise
}
api.interceptors.response.use((response) => {
  if (!['get', 'head', 'options'].includes(response.config.method)) {
    productGeneration += 1
    productReads.clear()
  }
  if (/\/products(?:\/|$)/.test(response.config.url)) {
    const decorate = (product) => ({
      ...product,
      gameName:
        {
          pokemon: 'Pokemon',
          'one-piece': 'One Piece',
          magic: 'Magic: The Gathering',
        }[product.game] || product.game,
    })
    response.data.data = Array.isArray(response.data.data)
      ? response.data.data.map(decorate)
      : decorate(response.data.data)
  }
  return response
})
