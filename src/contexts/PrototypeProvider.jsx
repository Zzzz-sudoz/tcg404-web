import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { PrototypeContext } from './PrototypeContext'
import { api, apiError } from '../utils/api'
import { games } from '../data/store'
import { mergeInventory } from '../utils/inventory'
export default function PrototypeProvider({ children }) {
  const { pathname } = useLocation()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const rememberProducts = useCallback(
    (items) =>
      setProducts((current) => {
        items = items.map((product) => ({
          ...product,
          gameName:
            product.gameName ||
            games.find((game) => game.id === product.game)?.name,
        }))
        return mergeInventory(current, items)
      }),
    [],
  )
  const refreshProducts = useCallback(
    async (signal) => {
      setLoading(true)
      setError('')
      try {
        const responses = await Promise.all([
          api.get('/products', {
            params: { featured: true, limit: 8 },
            signal,
          }),
          api.get('/products', {
            params: { sort: 'newest', limit: 8 },
            signal,
          }),
        ])
        rememberProducts(responses.flatMap((r) => r.data.data))
      } catch (e) {
        if (e.code !== 'ERR_CANCELED') setError(apiError(e))
      } finally {
        if (!signal?.aborted) setLoading(false)
      }
    },
    [rememberProducts],
  )
  useEffect(() => {
    if (pathname !== '/') return
    const controller = new AbortController()
    const timer = setTimeout(() => refreshProducts(controller.signal), 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [refreshProducts, pathname])
  const upsertProduct = async (product) => {
    const allowed = [
      'name',
      'slug',
      'sku',
      'game',
      'setName',
      'cardNumber',
      'rarity',
      'cardType',
      'language',
      'condition',
      'finish',
      'imageUrl',
      'description',
      'source',
      'externalId',
      'price',
      'stock',
      'lowStockThreshold',
      'isActive',
      'isFeatured',
      'marketReference',
    ]
    const values = Object.fromEntries(
      Object.entries(product).filter(([key]) => allowed.includes(key)),
    )
    const response = product.id
      ? await api.put(`/products/${product.id}`, values, {
          headers: { 'If-Match': String(product.revision) },
        })
      : await api.post('/products', values)
    rememberProducts([response.data.data])
    return response.data.data
  }
  const setProductActive = async (id, isActive) => {
    const response = await api.patch(`/products/${id}/status`, { isActive })
    rememberProducts([response.data.data])
  }
  return (
    <PrototypeContext
      value={{
        products,
        loading,
        error,
        refreshProducts,
        rememberProducts,
        upsertProduct,
        setProductActive,
      }}
    >
      {children}
    </PrototypeContext>
  )
}
