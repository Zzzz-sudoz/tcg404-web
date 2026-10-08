export const CART_STORAGE_KEY = 'tcg404_cart_v1'
export const cartPersistenceNotice =
  'Your cart cannot be saved in this browser. Keep this tab open; reloading may lose your cart.'
export const isCartId = (id) =>
  typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)

export function parseCartStorage(raw) {
  if (raw == null) return []
  try {
    if (typeof raw !== 'string' || raw.length > 32000) return []
    const data = JSON.parse(raw)
    if (
      data?.version !== 1 ||
      !Array.isArray(data.items) ||
      data.items.length > 50 ||
      Object.keys(data).some((key) => !['version', 'items'].includes(key))
    )
      return []
    const merged = new Map()
    for (const item of data.items) {
      if (
        !item ||
        !isCartId(item.id) ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 999 ||
        Object.keys(item).some(
          (key) =>
            !['id', 'quantity', 'addedPrice', 'addedStock'].includes(key),
        )
      )
        return []
      for (const key of ['addedPrice', 'addedStock']) {
        if (
          key in item &&
          (typeof item[key] !== 'number' ||
            !Number.isFinite(item[key]) ||
            item[key] < 0)
        )
          return []
      }
      const id = item.id.toLowerCase()
      const previous = merged.get(id)
      merged.set(
        id,
        previous
          ? {
              ...previous,
              quantity: Math.min(999, previous.quantity + item.quantity),
            }
          : { ...item, id },
      )
    }
    return [...merged.values()]
  } catch {
    return []
  }
}

export function serializeCart(cart) {
  return JSON.stringify({
    version: 1,
    items: cart.map(({ id, quantity, addedPrice, addedStock }) => ({
      id,
      quantity,
      addedPrice,
      addedStock,
    })),
  })
}

export function loadStoredCart(getStorage) {
  try {
    return {
      cart: parseCartStorage(getStorage().getItem(CART_STORAGE_KEY)),
      notice: '',
    }
  } catch {
    return { cart: [], notice: cartPersistenceNotice }
  }
}

export function saveStoredCart(getStorage, cart) {
  try {
    getStorage().setItem(CART_STORAGE_KEY, serializeCart(cart))
    return ''
  } catch {
    return cartPersistenceNotice
  }
}

export function addCartItem(cart, products, id, quantity) {
  const product = products.find((p) => p.id === id)
  const current = cart.find((p) => p.id === id)?.quantity || 0
  if (
    !product ||
    product.isActive === false ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity + current > 10 ||
    (current === 0 && cart.length >= 50) ||
    !Number.isFinite(product.price) ||
    product.price < 0 ||
    !Number.isSafeInteger(product.stock) ||
    quantity + current > product.stock
  )
    return { cart, error: 'Choose 1 to 10 per card, within available stock.' }
  return {
    cart: [
      ...cart.filter((p) => p.id !== id),
      {
        id,
        quantity: current + quantity,
        addedPrice: product.price,
        addedStock: product.stock,
      },
    ],
    error: '',
  }
}

export function updateCartQuantity(cart, products, id, quantity) {
  const product = products.find((p) => p.id === id)
  if (
    !product ||
    product.isActive === false ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 10 ||
    !Number.isSafeInteger(product.stock) ||
    quantity > product.stock
  )
    return { cart, error: 'Choose 1 to 10 per card, within available stock.' }
  return {
    cart: cart.map((item) => (item.id === id ? { ...item, quantity } : item)),
    error: '',
  }
}

export function retireCartItems(cart, submitted) {
  const quantities = new Map(
    submitted.map((item) => [item.productId, item.quantity]),
  )
  return cart.flatMap((item) => {
    const remaining = item.quantity - (quantities.get(item.id) || 0)
    return remaining > 0 ? [{ ...item, quantity: remaining }] : []
  })
}

export function priceInCents(price) {
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0)
    return NaN
  const [decimal, exponent = '0'] = String(price).split('e')
  const [whole, fraction = ''] = decimal.split('.')
  const digits = BigInt(whole + fraction)
  const scale = fraction.length - Number(exponent) - 2
  const cents =
    scale <= 0
      ? digits * 10n ** BigInt(-scale)
      : (digits + 10n ** BigInt(scale) / 2n) / 10n ** BigInt(scale)
  return cents <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(cents) : NaN
}

export function summarizeCart(cart, products) {
  let subtotalCents = 0
  const lines = cart.slice(0, 50).map((item) => {
    const product = products.find((p) => p.id === item.id)
    const quantity =
      Number.isSafeInteger(item.quantity) &&
      item.quantity >= 1 &&
      item.quantity <= 999
        ? item.quantity
        : 0
    const price = product?.price
    const cents = priceInCents(price)
    const safePrice =
      Number.isFinite(price) &&
      price >= 0 &&
      Number.isSafeInteger(cents) &&
      Number.isSafeInteger(cents * quantity) &&
      Number.isSafeInteger(subtotalCents + cents * quantity)
    const reason =
      !product || product.isActive === false
        ? 'This card is unavailable.'
        : !quantity ||
            !Number.isSafeInteger(product.stock) ||
            quantity > product.stock ||
            quantity > 10
          ? 'Choose 1 to 10 per card, within available stock.'
          : !safePrice
            ? 'Current price is unavailable.'
            : ''
    const totalCents = safePrice ? cents * quantity : 0
    subtotalCents += totalCents
    return {
      ...item,
      quantity,
      product,
      total: totalCents / 100,
      reason,
      priceChanged:
        item.addedPrice != null && product?.price !== item.addedPrice,
      stockChanged:
        item.addedStock != null && product?.stock !== item.addedStock,
    }
  })
  return {
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: subtotalCents / 100,
    valid:
      lines.length > 0 &&
      cart.length <= 50 &&
      lines.every((line) => !line.reason),
  }
}
