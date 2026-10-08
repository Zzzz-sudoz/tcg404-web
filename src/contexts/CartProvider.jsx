import { useCallback, useEffect, useRef, useState, useContext } from 'react'
import { CartContext } from './CartContext'
import { PrototypeContext } from './PrototypeContext'
import {
  CART_STORAGE_KEY,
  addCartItem,
  updateCartQuantity,
  isCartId,
  loadStoredCart,
  saveStoredCart,
  parseCartStorage,
  serializeCart,
  retireCartItems,
} from '../utils/cart'
import { beginOrderAttempt, finishOrderAttempt } from '../utils/checkout'
import { api } from '../utils/api'

const getStorage = () => window.localStorage

export default function CartProvider({ children }) {
  const { products } = useContext(PrototypeContext)
  const [initial] = useState(() => loadStoredCart(getStorage))
  const [cart, setCart] = useState(initial.cart)
  const [persistenceNotice, setPersistenceNotice] = useState(initial.notice)
  const [orderRequest, setOrderRequest] = useState(null)
  const request = useRef(null)
  const dismissOrderReceipt = useCallback(() => {
    if (!request.current?.receipt) return
    request.current = { ...request.current, receipt: null }
    setOrderRequest(request.current)
  }, [])
  const current = useRef(cart)
  const persisted = useRef(serializeCart(initial.cart))
  useEffect(() => {
    const serialized = serializeCart(cart)
    if (serialized === persisted.current) return
    const notice = saveStoredCart(getStorage, cart)
    persisted.current = serialized
    const timer = setTimeout(() => setPersistenceNotice(notice), 0)
    return () => clearTimeout(timer)
  }, [cart])
  useEffect(() => {
    const synchronize = (event) => {
      if (event.key !== CART_STORAGE_KEY && event.key !== null) return
      try {
        if (event.storageArea && event.storageArea !== getStorage()) return
      } catch {
        return
      }
      const items = parseCartStorage(event.newValue)
      persisted.current = serializeCart(items)
      current.current = items
      setCart(items)
    }
    window.addEventListener('storage', synchronize)
    return () => window.removeEventListener('storage', synchronize)
  }, [])
  const change = (operation, id, quantity) => {
    if (!isCartId(id)) return 'This card cannot be added to a saved cart.'
    const result = operation(current.current, products, id, quantity)
    if (!result.error) {
      dismissOrderReceipt()
      current.current = result.cart
      setCart(result.cart)
    }
    return result.error
  }
  const replace = (items) => {
    current.current = items
    setCart(items)
  }
  const placeOrder = async (payload, ownerId) => {
    request.current = beginOrderAttempt(request.current, payload, ownerId)
    setOrderRequest(request.current)
    let receipt = null
    try {
      const response = await api.post('/orders', request.current.payload, {
        headers: { 'Idempotency-Key': request.current.key },
      })
      if (response.data.success !== true || !response.data.data?.orderNumber)
        throw new Error(
          'The server did not confirm a saved order. Your cart is still here; retry to check the same request.',
        )
      setCart((items) => {
        const remaining = retireCartItems(items, payload.items)
        current.current = remaining
        return remaining
      })
      receipt = response.data.data
      return receipt
    } finally {
      request.current = finishOrderAttempt(request.current, receipt)
      setOrderRequest(request.current)
    }
  }
  return (
    <CartContext
      value={{
        cart,
        persistenceNotice,
        orderRequest,
        placeOrder,
        dismissOrderReceipt,
        addToCart: (id, quantity) => change(addCartItem, id, quantity),
        setCartQuantity: (id, quantity) =>
          change(updateCartQuantity, id, quantity),
        removeFromCart: (id) =>
          replace(current.current.filter((item) => item.id !== id)),
        clearCart: () => replace([]),
      }}
    >
      {children}
    </CartContext>
  )
}
