import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useApiQuery } from '../../hooks/useApiQuery'
import { formatPrice } from '../../data/store'
import Pagination from '../../components/common/Pagination'
import QueryState from '../../components/common/QueryState'
import { orderStatuses, validateDateRange } from '../../utils/operations'
import { paymentLabel, paymentMethodLabel } from '../../utils/checkout'

export default function OrdersPage({ admin = false }) {
  const [params, setParams] = useSearchParams()
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const response = useApiQuery(
    admin ? '/admin/orders' : '/orders/my-orders',
    params.toString(),
    revision,
  )
  const base = admin ? '/admin/orders' : '/account/orders'
  const updatePage = (page) => {
    const next = new URLSearchParams(params)
    next.set('page', page)
    setParams(next)
  }
  const filter = (event) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const issue = validateDateRange(values.from, values.to)
    setError(issue)
    if (!issue)
      setParams(
        Object.fromEntries(Object.entries(values).filter(([, value]) => value)),
      )
  }
  return (
    <div className={admin ? 'admin-page' : 'page-width workshop-page'}>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">
            {admin ? 'COLLECTOR OPERATIONS' : 'YOUR ACCOUNT'}
          </p>
          <h1>{admin ? 'Saved orders.' : 'Your order history.'}</h1>
          <p>Order totals and delivery details are recorded when you order.</p>
        </div>
        {!admin && (
          <Link className="button" to="/account">
            Your account
          </Link>
        )}
      </header>
      {admin && (
        <form
          className="admin-toolbar"
          onSubmit={filter}
          key={params.toString()}
        >
          <label>
            Search orders
            <input
              name="search"
              type="search"
              maxLength={100}
              defaultValue={params.get('search') || ''}
            />
          </label>
          <label>
            Order status
            <select name="status" defaultValue={params.get('status') || ''}>
              <option value="">All statuses</option>
              {orderStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
          <label>
            From (UTC)
            <input
              name="from"
              type="date"
              defaultValue={params.get('from') || ''}
            />
          </label>
          <label>
            To (UTC)
            <input
              name="to"
              type="date"
              defaultValue={params.get('to') || ''}
            />
          </label>
          <button className="button button-primary">Apply filters</button>
          <button
            type="button"
            className="button"
            onClick={() => {
              setError('')
              setParams({})
            }}
          >
            Clear filters
          </button>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
      <QueryState
        response={response}
        retry={() => setRevision((v) => v + 1)}
        empty="No orders in this view."
      />
      {!response.loading && !response.error && response.data.length > 0 && (
        <section className="admin-panel">
          <p className="scroll-hint orders-scroll-hint">
            Scroll horizontally for all columns. Keyboard: focus the table area
            and use arrow keys.
          </p>
          <div
            className="table-scroll"
            role="region"
            tabIndex={0}
            aria-label="Saved orders; scroll horizontally for all columns"
          >
            <table className="responsive-orders" role="table">
              <caption className="sr-only">Saved orders</caption>
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Created</th>
                  {admin && <th scope="col">Customer</th>}
                  <th scope="col">Status</th>
                  <th scope="col">Payment</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {response.data.map((order) => (
                  <tr key={order.id} role="row">
                    <td data-label="Order" role="cell">
                      <Link to={`${base}/${order.id}`}>
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td data-label="Created" role="cell">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    {admin && (
                      <td data-label="Customer" role="cell">
                        {order.shipping.name}
                        <small>{order.shipping.email}</small>
                      </td>
                    )}
                    <td data-label="Status" role="cell">
                      <span className="status-chip">{order.status}</span>
                    </td>
                    <td data-label="Payment" role="cell">
                      {paymentLabel(order)}
                      {order.payment && (
                        <small>{paymentMethodLabel(order.payment)}</small>
                      )}
                    </td>
                    <td data-label="Total" role="cell">
                      {formatPrice(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={response.meta.page || 1}
            pages={response.meta.totalPages || 1}
            onChange={updatePage}
          />
        </section>
      )}
    </div>
  )
}
