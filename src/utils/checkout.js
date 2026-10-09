import { isCartId, summarizeCart } from './cart.js'

export function validateCheckout(values) {
  const errors = {}
  const name = (values.name || '').trim()
  const email = (values.email || '').trim()
  const phone = (values.phone || '').trim()
  const address = (values.address || '').trim()
  if (!name || name.length > 100)
    errors.name = 'Enter a recipient name of 1 to 100 characters.'
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = 'Enter a valid email address.'
  if (
    !/^[+\d ().-]{7,30}$/.test(phone) ||
    (phone.match(/\d/g) || []).length < 7
  )
    errors.phone = 'Enter a phone number with at least seven digits.'
  if (address.length < 5 || address.length > 500)
    errors.address = 'Enter a delivery address of 5 to 500 characters.'
  if ((values.notes || '').trim().length > 500)
    errors.notes = 'Keep notes within 500 characters.'
  for (const key of ['city', 'province', 'postalCode']) {
    if (
      Object.hasOwn(values, key) &&
      (!values[key]?.trim() || values[key].trim().length > 100)
    )
      errors[key] = `Enter your ${key === 'postalCode' ? 'postal code' : key}.`
  }
  if (values.postalCode && !/^\d{4}$/.test(values.postalCode.trim()))
    errors.postalCode = 'Enter a four-digit Philippine postal code.'
  return errors
}

export function cardBrand(number = '') {
  const digits = number.replace(/\D/g, '')
  if (/^4/.test(digits)) return 'visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard'
  return 'card'
}

export function validatePayment(payment) {
  const errors = {}
  if (payment.method === 'card') {
    const digits = (payment.number || '').replace(/\D/g, '')
    const checksum = [...digits].reverse().reduce((sum, digit, index) => {
      const value = Number(digit) * (index % 2 ? 2 : 1)
      return sum + (value > 9 ? value - 9 : value)
    }, 0)
    if (
      !/^[\d -]+$/.test(payment.number || '') ||
      !/^\d{13,19}$/.test(digits) ||
      /^0+$/.test(digits) ||
      checksum % 10 !== 0
    )
      errors.number = 'Enter a valid card number of 13 to 19 digits.'
    if (!payment.holder?.trim() || payment.holder.trim().length > 100)
      errors.holder = 'Enter the name on your card.'
    const expiry = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(payment.expiry || '')
    const today = new Date()
    if (
      !expiry ||
      new Date(2000 + Number(expiry[2]), Number(expiry[1]), 1) <= today
    )
      errors.expiry = 'Enter a current or future expiry in MM/YY format.'
    if (!/^\d{3,4}$/.test(payment.cvc || ''))
      errors.cvc = 'Enter 3 or 4 digits.'
  } else if (payment.method === 'gcash') {
    if (
      !/^(09\d{9}|\+639\d{9})$/.test(
        (payment.mobile || '').replace(/[ -]/g, ''),
      )
    )
      errors.mobile = 'Enter a GCash mobile number, such as 09123456789.'
  } else errors.method = 'Choose a payment method.'
  return errors
}

export function paymentMetadata(payment) {
  if (Object.keys(validatePayment(payment)).length)
    throw new Error('Review your payment details.')
  return {
    method: payment.method,
    brand: payment.method === 'gcash' ? 'gcash' : cardBrand(payment.number),
    last4: (payment.method === 'gcash' ? payment.mobile : payment.number)
      .replace(/\D/g, '')
      .slice(-4),
  }
}

export function paymentLabel(order) {
  if (order.paymentStatus === 'simulated') return 'Confirmed'
  return order.paymentStatus === 'paid' ? 'Paid' : 'Awaiting payment'
}

export function paymentMethodLabel(payment) {
  if (!payment) return 'Not selected'
  const name =
    { visa: 'Visa', mastercard: 'Mastercard', card: 'Card', gcash: 'GCash' }[
      payment.brand
    ] || 'Card'
  return `${name} ···· ${payment.last4}`
}

export function deliveryAddress(shipping) {
  return [
    shipping.address,
    [shipping.city, shipping.province, shipping.postalCode]
      .filter(Boolean)
      .join(', '),
    shipping.country,
  ]
    .filter(Boolean)
    .join('\n')
}

export function buildOrderPayload(cart, products, fields, payment) {
  const summary = summarizeCart(cart, products)
  if (
    !summary.valid ||
    Object.keys(validateCheckout(fields)).length ||
    cart.some((line) => !isCartId(line.id)) ||
    new Set(cart.map((line) => line.id)).size !== cart.length
  )
    throw new Error(
      'Review cart availability and delivery details before saving your order.',
    )
  return {
    items: summary.lines
      .map((line) => ({
        productId: line.id,
        quantity: line.quantity,
        expectedPrice: line.product.price,
      }))
      .sort((a, b) => a.productId.localeCompare(b.productId)),
    shipping: Object.fromEntries(
      [
        'name',
        'email',
        'phone',
        'address',
        'notes',
        'city',
        'province',
        'postalCode',
        'country',
      ]
        .filter((key) => fields[key] !== undefined)
        .filter((key) => key !== 'notes' || fields.notes?.trim())
        .map((key) => [key, fields[key].trim()]),
    ),
    ...(payment ? { payment: paymentMetadata(payment) } : {}),
  }
}

export function orderAttempt(
  previous,
  payload,
  userId,
  uuid = () => crypto.randomUUID(),
) {
  const fingerprint = JSON.stringify({ userId, payload })
  return previous?.fingerprint === fingerprint
    ? previous
    : { fingerprint, key: uuid(), payload }
}

export function beginOrderAttempt(previous, payload, userId, uuid) {
  if (previous?.pending)
    throw new Error(
      'An order is already being saved. Wait for that request before retrying.',
    )
  return {
    ...orderAttempt(
      previous?.completed ? null : previous,
      payload,
      userId,
      uuid,
    ),
    ownerId: userId,
    pending: true,
    receipt: null,
  }
}

export function finishOrderAttempt(attempt, receipt = null) {
  return { ...attempt, pending: false, completed: !!receipt, receipt }
}
