import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useApiQuery } from '../../hooks/useApiQuery'
import { api, apiError } from '../../utils/api'
import { formatPrice } from '../../data/store'
import { statusOptions, orderStatusLabel } from '../../utils/operations'
import QueryState from '../../components/common/QueryState'
import {
  paymentLabel,
  paymentMethodLabel,
  deliveryAddress,
} from '../../utils/checkout'

export default function OrderDetailPage({ admin = false }) {
  const { id } = useParams()
  const [revision, setRevision] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const pending = useRef(false)
  const feedback = useRef(null)
  const path = `${admin ? '/admin/orders' : '/orders'}/${id}`
  const response = useApiQuery(path, '', revision)
  const order = response.data
  const update = async (event) => {
    event.preventDefault()
    if (pending.current) return
    pending.current = true
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.patch(`${path}/status`, {
        status: new FormData(event.currentTarget).get('status'),
        revision: order.revision,
      })
      setMessage('Order status saved.')
      setRevision((v) => v + 1)
    } catch (e) {
      setError(apiError(e))
      feedback.current?.focus()
    } finally {
      pending.current = false
      setSaving(false)
    }
  }
  return (
    <div className={admin ? 'admin-page' : 'page-width workshop-page'}>
      <Link
        className="text-link"
        to={admin ? '/admin/orders' : '/account/orders'}
      >
        Back to orders
      </Link>
      <QueryState response={response} retry={() => setRevision((v) => v + 1)} />
      {!response.loading && !response.error && (
        <>
          <header className="admin-heading">
            <div>
              <p className="eyebrow">SAVED RECEIPT</p>
              <h1>{order.orderNumber}</h1>
              <p>
                Created {new Date(order.createdAt).toLocaleString()} ·{' '}
                <strong>{orderStatusLabel(order.status)}</strong> · Payment:{' '}
                <strong>{paymentLabel(order)}</strong>
              </p>
            </div>
          </header>
          <div className="commerce-layout">
            <section className="admin-panel">
              {admin && (
                <div className="order-buyer">
                  <h2>Customer</h2>
                  <p>
                    {order.buyer?.name || order.shipping.name}
                    <br />
                    {order.buyer?.email || order.shipping.email}
                  </p>
                </div>
              )}
              <h2>Ordered singles</h2>
              <p className="scroll-hint orders-scroll-hint">
                Scroll horizontally for all columns. Keyboard: focus the table
                area and use arrow keys.
              </p>
              <div
                className="table-scroll"
                role="region"
                tabIndex={0}
                aria-label="Ordered singles; scroll horizontally for all columns"
              >
                <table className="responsive-orders" role="table">
                  <thead>
                    <tr>
                      <th scope="col">Card</th>
                      <th scope="col">Quantity</th>
                      <th scope="col">Unit price</th>
                      <th scope="col">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((line) => (
                      <tr key={line.productId} role="row">
                        <td data-label="Card" role="cell">
                          {line.name}
                          <small>
                            {line.game} · {line.setName} · {line.condition}
                          </small>
                        </td>
                        <td data-label="Quantity" role="cell">
                          {line.quantity}
                        </td>
                        <td data-label="Unit price" role="cell">
                          {formatPrice(line.price ?? line.unitPrice)}
                        </td>
                        <td data-label="Total" role="cell">
                          {formatPrice(line.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h2>Delivery address</h2>
              <p>
                {order.shipping.name}
                <br />
                {order.shipping.email}
                <br />
                {order.shipping.phone}
              </p>
              <p className="preserve-lines">
                {deliveryAddress(order.shipping)}
              </p>
              {order.shipping.notes && (
                <p className="preserve-lines">Notes: {order.shipping.notes}</p>
              )}
            </section>
            <aside className="order-summary">
              <h2>Receipt totals</h2>
              {[
                ['Subtotal', order.subtotal],
                ['Shipping', order.shippingFee],
                ['Tax', order.tax],
                ['Total', order.total],
              ].map(([label, value]) => (
                <div className="row-between" key={label}>
                  <span>{label}</span>
                  <strong>{formatPrice(value)}</strong>
                </div>
              ))}
              <h2>Payment details</h2>
              <p>{paymentMethodLabel(order.payment)}</p>
              {order.payment?.reference && (
                <p className="payment-reference">
                  Reference: {order.payment.reference}
                </p>
              )}
              {admin && statusOptions(order.status).length > 0 && (
                <form onSubmit={update}>
                  <h2>Update order status</h2>
                  <label>
                    Next status
                    <select name="status" disabled={saving}>
                      {statusOptions(order.status).map((status) => (
                        <option key={status} value={status}>
                          {orderStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="muted">
                    Cancellation restores ordered stock once. Completed and
                    cancelled orders are final.
                  </p>
                  <button className="button button-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save status'}
                  </button>
                </form>
              )}
              <p
                ref={feedback}
                tabIndex={-1}
                role={error ? 'alert' : undefined}
                className="field-error"
              >
                {error}
              </p>
              {error && (
                <button
                  className="button"
                  disabled={saving}
                  onClick={() => {
                    setError('')
                    setRevision((v) => v + 1)
                  }}
                >
                  Reload current order
                </button>
              )}
              {message && <p role="status">{message}</p>}
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
