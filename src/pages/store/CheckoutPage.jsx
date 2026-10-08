import { orderStatusLabel } from '../../utils/operations'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { usePrototype } from '../../hooks/usePrototype'
import { useAuth } from '../../hooks/useAuth'
import { summarizeCart } from '../../utils/cart'
import {
  validateCheckout,
  buildOrderPayload,
  validatePayment,
  paymentLabel,
  paymentMethodLabel,
  deliveryAddress,
} from '../../utils/checkout'
import PaymentFields from '../../components/store/PaymentFields'
import { apiError, apiFields } from '../../utils/api'
import { formatPrice } from '../../data/store'
import { useCartInventory } from '../../hooks/useCartInventory'
import { useApiQuery } from '../../hooks/useApiQuery'

export default function CheckoutPage() {
  const { cart, products, placeOrder, orderRequest, persistenceNotice } =
    usePrototype()
  const { user } = useAuth()
  const summary = summarizeCart(cart, products)
  const inventory = useCartInventory()
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const confirmation =
    orderRequest?.ownerId === user.id ? orderRequest.receipt : null
  const [submitting, setSubmitting] = useState(false)
  const saving = submitting || !!orderRequest?.pending
  const pending = useRef(false)
  const errorSummary = useRef(null)
  const touched = useRef(new Set())
  const paymentTouched = useRef(false)
  const saved = useApiQuery('/auth/preferences')
  const [addressId, setAddressId] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [payment, setPayment] = useState({
    method: 'card',
    number: '',
    holder: user.name || '',
    expiry: '',
    cvc: '',
    mobile: '',
  })
  const [fields, setFields] = useState(() => ({
    name: user.name || '',
    email: user.email || '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Philippines',
    notes: '',
    ...(orderRequest?.ownerId === user.id ? orderRequest.payload.shipping : {}),
  }))
  useEffect(() => {
    const preferences = saved.data.preferences
    if (
      !preferences ||
      orderRequest?.pending ||
      orderRequest?.ownerId === user.id
    )
      return
    const timer = setTimeout(() => {
      const address = preferences.addresses[0]
      if (address) {
        setFields((current) => ({
          ...current,
          ...Object.fromEntries(
            Object.entries(address).filter(
              ([key]) =>
                Object.hasOwn(current, key) && !touched.current.has(key),
            ),
          ),
        }))
        setAddressId(address.id)
      }
      const method = preferences.payments[0]
      if (method && !paymentTouched.current) {
        setPayment((current) => ({
          ...current,
          method: method.method,
          holder: method.holder || current.holder,
          expiry: method.expiry || '',
          mobile: method.mobile || '',
        }))
        setPaymentId(method.id)
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [saved.data, orderRequest, user.id])
  const blocked = !summary.valid || inventory.loading || !!inventory.error
  const clearError = (key) =>
    setErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([field]) => field !== key),
      ),
    )
  const updateField = (key, value) => {
    touched.current.add(key)
    setFields((current) => ({ ...current, [key]: value }))
    clearError(key)
  }
  const submit = async (event) => {
    event.preventDefault()
    if (pending.current || saving || blocked) return
    const issues = {
      ...validateCheckout(fields),
      ...Object.fromEntries(
        Object.entries(validatePayment(payment)).map(([key, value]) => [
          `payment-${key}`,
          value,
        ]),
      ),
    }
    setErrors(issues)
    setMessage('')
    if (Object.keys(issues).length) {
      errorSummary.current?.focus()
      return
    }
    pending.current = true
    setSubmitting(true)
    try {
      const payload = buildOrderPayload(cart, products, fields, payment)
      await placeOrder(payload, user.id)
      setPayment({
        method: 'card',
        number: '',
        holder: '',
        expiry: '',
        cvc: '',
        mobile: '',
      })
    } catch (e) {
      const apiIssues = apiFields(e)
      setErrors(
        Object.fromEntries(
          Object.entries(apiIssues).map(([key, value]) => [
            key.replace(/^shipping\./, ''),
            value,
          ]),
        ),
      )
      setMessage(apiError(e))
      const code = e.response?.data?.error?.code || e.response?.data?.code
      if (
        ['STOCK_CONFLICT', 'PRICE_CHANGED', 'PRODUCT_UNAVAILABLE'].includes(
          code,
        )
      )
        inventory.retry()
      errorSummary.current?.focus()
    } finally {
      pending.current = false
      setSubmitting(false)
    }
  }
  if (confirmation)
    return (
      <div className="page-width workshop-page">
        <div className="confirmation-panel">
          <p className="eyebrow">
            ORDER CONFIRMED / {confirmation.orderNumber}
          </p>
          <h1>Your next finds, confirmed.</h1>
          <p>
            Order status:{' '}
            <strong>{orderStatusLabel(confirmation.status)}</strong>. Payment
            status: <strong>{paymentLabel(confirmation)}</strong>.
          </p>
          <p>{paymentMethodLabel(confirmation.payment)}</p>
          <h2>Deliver to</h2>
          <p>
            {confirmation.shipping.name} · {confirmation.shipping.phone}
          </p>
          <p className="preserve-lines">
            {deliveryAddress(confirmation.shipping)}
          </p>
          <ul>
            {confirmation.items.map((line) => (
              <li key={line.productId}>
                {line.name} × {line.quantity} · {formatPrice(line.lineTotal)}
              </li>
            ))}
          </ul>
          {[
            ['Subtotal', confirmation.subtotal],
            ['Shipping', confirmation.shippingFee],
            ['Tax', confirmation.tax],
            ['Total', confirmation.total],
          ].map(([label, value]) => (
            <div className="row-between" key={label}>
              <span>{label}</span>
              <strong>{formatPrice(value)}</strong>
            </div>
          ))}
          <Link className="text-link" to={`/account/orders/${confirmation.id}`}>
            View order details
          </Link>
          {cart.length > 0 && (
            <Link className="text-link" to="/cart">
              View remaining cart
            </Link>
          )}
          <Link className="button button-primary" to="/shop">
            Browse more singles
          </Link>
        </div>
      </div>
    )
  return (
    <div className="page-width workshop-page">
      <header className="page-intro">
        <p className="eyebrow">CHECKOUT / YOUR SINGLES</p>
        <h1>One last look.</h1>
        <p>Delivery, payment, and your next great find.</p>
      </header>
      {persistenceNotice && (
        <p role="status" className="persistence-notice">
          {persistenceNotice}
        </p>
      )}
      {!cart.length ? (
        <div className="empty-panel">
          <h2>Your cart is empty.</h2>
          <Link className="button" to="/cart">
            Return to cart
          </Link>
        </div>
      ) : (
        <div className="commerce-layout">
          <form
            className="editor-panel"
            noValidate
            onSubmit={submit}
            aria-busy={saving}
          >
            <h2>Delivery details</h2>
            <div className="saved-checkout-details">
              {!!saved.data.preferences?.addresses.length && (
                <label>
                  Saved address
                  <select
                    value={addressId}
                    disabled={saving}
                    onChange={(event) => {
                      setAddressId(event.target.value)
                      const address = saved.data.preferences.addresses.find(
                        (row) => row.id === event.target.value,
                      )
                      if (address) {
                        Object.keys(address).forEach((key) =>
                          touched.current.add(key),
                        )
                        setFields((current) => ({
                          ...current,
                          ...Object.fromEntries(
                            Object.entries(address).filter(([key]) =>
                              Object.hasOwn(current, key),
                            ),
                          ),
                        }))
                      }
                    }}
                  >
                    <option value="">Enter address</option>
                    {saved.data.preferences.addresses.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!!saved.data.preferences?.payments.length && (
                <label>
                  Saved payment method
                  <select
                    value={paymentId}
                    disabled={saving}
                    onChange={(event) => {
                      paymentTouched.current = true
                      setPaymentId(event.target.value)
                      const method = saved.data.preferences.payments.find(
                        (row) => row.id === event.target.value,
                      )
                      setPayment((current) => ({
                        ...current,
                        method: method?.method || 'card',
                        holder: method?.holder || user.name,
                        expiry: method?.expiry || '',
                        mobile: method?.mobile || '',
                        number: '',
                        cvc: '',
                      }))
                    }}
                  >
                    <option value="">Use another method</option>
                    {saved.data.preferences.payments.map((row) => (
                      <option key={row.id} value={row.id}>
                        {row.label} ·{' '}
                        {row.method === 'gcash'
                          ? 'GCash'
                          : `${row.brand} ${row.last4}`}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            {[
              ['name', 'Recipient name', 'text', 100, 'name'],
              ['email', 'Email', 'email', 254, 'email'],
              ['phone', 'Phone', 'tel', 30, 'tel'],
            ].map(([key, label, type, maxLength, autoComplete]) => (
              <label htmlFor={`delivery-${key}`} key={key}>
                {label}
                <input
                  id={`delivery-${key}`}
                  name={key}
                  autoComplete={autoComplete}
                  required
                  disabled={saving}
                  type={type}
                  maxLength={maxLength}
                  value={fields[key]}
                  onChange={(event) => updateField(key, event.target.value)}
                  aria-invalid={!!errors[key]}
                  aria-describedby={errors[key] ? `checkout-${key}` : undefined}
                />
                {errors[key] && (
                  <span className="field-error" id={`checkout-${key}`}>
                    {errors[key]}
                  </span>
                )}
              </label>
            ))}
            {[
              ['address', 'Street address / barangay', true],
              ['notes', 'Order notes (optional)', false],
            ].map(([key, label, required]) => (
              <label htmlFor={`delivery-${key}`} key={key}>
                {label}
                <textarea
                  id={`delivery-${key}`}
                  name={key}
                  autoComplete={
                    key === 'address' ? 'street-address' : undefined
                  }
                  required={required}
                  disabled={saving}
                  maxLength={500}
                  value={fields[key]}
                  onChange={(event) => updateField(key, event.target.value)}
                  aria-invalid={!!errors[key]}
                  aria-describedby={errors[key] ? `checkout-${key}` : undefined}
                />
                {errors[key] && (
                  <span className="field-error" id={`checkout-${key}`}>
                    {errors[key]}
                  </span>
                )}
              </label>
            ))}
            <div className="delivery-grid">
              {[
                ['city', 'City / municipality', 'address-level2'],
                ['province', 'Province / Metro Manila', 'address-level1'],
                ['postalCode', 'Postal code', 'postal-code'],
              ].map(([key, label, autoComplete]) => (
                <label key={key} htmlFor={`delivery-${key}`}>
                  {label}
                  <input
                    id={`delivery-${key}`}
                    name={key}
                    value={fields[key]}
                    autoComplete={autoComplete}
                    inputMode={key === 'postalCode' ? 'numeric' : 'text'}
                    maxLength={key === 'postalCode' ? 4 : 100}
                    disabled={saving}
                    required
                    onChange={(event) => updateField(key, event.target.value)}
                    aria-invalid={!!errors[key]}
                    aria-describedby={
                      errors[key] ? `checkout-${key}` : undefined
                    }
                  />
                  {errors[key] && (
                    <span className="field-error" id={`checkout-${key}`}>
                      {errors[key]}
                    </span>
                  )}
                </label>
              ))}
              <label htmlFor="delivery-country">
                Country
                <input
                  id="delivery-country"
                  name="country"
                  value="Philippines"
                  readOnly
                  autoComplete="country-name"
                />
              </label>
            </div>
            <PaymentFields
              value={payment}
              onChange={(next) => {
                paymentTouched.current = true
                setPayment(next)
              }}
              onFieldChange={(key) => {
                if (key === 'method')
                  setErrors((current) =>
                    Object.fromEntries(
                      Object.entries(current).filter(
                        ([field]) => !field.startsWith('payment-'),
                      ),
                    ),
                  )
                else clearError(`payment-${key}`)
              }}
              disabled={saving}
              errors={Object.fromEntries(
                Object.entries(errors)
                  .filter(([key]) => key.startsWith('payment-'))
                  .map(([key, value]) => [key.slice(8), value]),
              )}
            />
            <div
              ref={errorSummary}
              tabIndex={-1}
              className="field-error"
              role={message || Object.keys(errors).length ? 'alert' : undefined}
            >
              {message && <p>{message}</p>}
              {Object.keys(errors).length > 0 && (
                <>
                  <p>Check the highlighted details to continue.</p>
                  <ul>
                    {Object.entries(errors).map(([key, value]) => (
                      <li key={key}>
                        {Object.hasOwn(fields, key) ||
                        key.startsWith('payment-') ? (
                          <a
                            href={`#${key.startsWith('payment-') ? key : `delivery-${key}`}`}
                            onClick={(event) => {
                              const field = document.getElementById(
                                key.startsWith('payment-')
                                  ? key
                                  : `delivery-${key}`,
                              )
                              if (field) {
                                event.preventDefault()
                                field.focus()
                              }
                            }}
                          >
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <button
              className="button button-primary"
              disabled={saving || blocked}
            >
              {saving
                ? 'Placing your order...'
                : `Pay ${formatPrice(summary.subtotal)} & place order`}
            </button>
          </form>
          <aside className="order-summary">
            <h2>Your singles</h2>
            {inventory.loading && (
              <p role="status">Checking current prices and stock...</p>
            )}
            {inventory.error && (
              <div role="alert">
                <p>{inventory.error}</p>
                <button
                  type="button"
                  className="button"
                  disabled={saving}
                  onClick={inventory.retry}
                >
                  Check inventory again
                </button>
              </div>
            )}
            {summary.lines.map((line) => (
              <div key={line.id}>
                <div className="row-between">
                  <span>
                    {line.product?.name || 'Unavailable card'} × {line.quantity}
                  </span>
                  <strong>{formatPrice(line.total)}</strong>
                </div>
                {line.reason && (
                  <p role="alert" className="field-error">
                    {line.reason}
                  </p>
                )}
                {line.priceChanged && (
                  <p role="status">
                    Price changed since adding. Review the current price before
                    saving.
                  </p>
                )}
                {line.stockChanged && (
                  <p role="status">
                    Stock changed since adding. Current availability:{' '}
                    {line.product?.stock ?? 0}.
                  </p>
                )}
              </div>
            ))}
            {[
              ['Subtotal', summary.subtotal],
              ['Shipping', 0],
              ['Tax', 0],
              ['Estimated total', summary.subtotal],
            ].map(([label, value]) => (
              <div className="row-between" key={label}>
                <span>{label}</span>
                <strong>{formatPrice(value)}</strong>
              </div>
            ))}
            <p>
              {payment.method === 'gcash' ? 'GCash' : 'Credit / debit card'}{' '}
              selected · Delivery within the Philippines
            </p>
            {blocked && !inventory.loading && !inventory.error && (
              <p role="alert">
                Resolve unavailable quantities in your cart before saving.
              </p>
            )}
            <Link to="/cart">Edit cart</Link>
          </aside>
        </div>
      )}
    </div>
  )
}
