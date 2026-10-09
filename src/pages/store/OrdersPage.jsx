import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useOrderQuery } from '../../hooks/useOrderQuery'
import { orderCategories, orderCategoryQuery } from '../../utils/orderHistory'
import { formatPrice } from '../../data/store'
import Pagination from '../../components/common/Pagination'
import QueryState from '../../components/common/QueryState'
import {
  orderStatuses,
  validateDateRange,
  orderStatusLabel,
} from '../../utils/operations'
import { paymentLabel, paymentMethodLabel } from '../../utils/checkout'

export default function OrdersPage({ admin = false }) {
  const [params, setParams] = useSearchParams()
  const [error, setError] = useState('')
  const response = useOrderQuery(
    admin ? '/admin/orders' : '/orders/my-orders',
    params.toString(),
    admin,
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
          {admin && <p className="eyebrow">COLLECTOR OPERATIONS</p>}
          <h1>{admin ? 'Order management.' : 'Your order history.'}</h1>
        </div>
        {!admin && <div className="order-heading-actions">
          <button className="button" onClick={response.refresh} disabled={response.loading || response.refreshing}>
            {response.refreshing ? 'Refreshing...' : 'Refresh orders'}
          </button>
        </div>}
      </header>
      {!admin && (
        <nav className="order-categories" aria-label="Order categories">
          {orderCategories.map(([label, status]) => (
            <button
              key={status}
              className="button"
              aria-current={(params.get('status') || '') === status ? 'page' : undefined}
              onClick={() => setParams(orderCategoryQuery(params, status))}
            >{label}</button>
          ))}
        </nav>
      )}
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
                <option key={status} value={status}>
                  {orderStatusLabel(status)}
                </option>
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
        retry={response.refresh}
        empty="No orders in this view."
      />
      {response.refreshError && <p className="field-error" role="alert">Could not refresh orders: {response.refreshError} Your saved view is still shown.</p>}
      {!admin && !response.loading && !response.error && response.data.length > 0 && (
        <section className="customer-order-list" aria-label="Your orders">
          {response.data.map((order) => (
            <article className="admin-panel customer-order" key={order.id}>
              <div className="row-between">
                <h2><Link to={`${base}/${order.id}`}>{order.orderNumber}</Link></h2>
                <span className="status-chip" data-status={order.status}>{orderStatusLabel(order.status)}</span>
              </div>
              <p>Placed <time dateTime={order.createdAt}>{new Date(order.createdAt).toLocaleDateString()}</time></p>
              {order.updatedAt && order.updatedAt !== order.createdAt && <p>Status updated <time dateTime={order.updatedAt}>{new Date(order.updatedAt).toLocaleString()}</time></p>}
              <p>Payment: {paymentLabel(order)}</p>
              <ul className="order-item-previews">
                {(order.items || []).slice(0, 3).map((item) => (
                  <li key={item.productId}>
                    {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" />}
                    <span>{item.name}<small>Quantity: {item.quantity}</small></span>
                  </li>
                ))}
              </ul>
              {order.items?.length > 3 && <p>+{order.items.length - 3} more items</p>}
              <div className="row-between">
                <strong>Total {formatPrice(order.total)}</strong>
                <Link className="text-link" to={`${base}/${order.id}`}>View order <span className="sr-only">{order.orderNumber}</span></Link>
              </div>
            </article>
          ))}
          <Pagination page={response.meta.page || 1} pages={response.meta.totalPages || 1} onChange={updatePage} />
        </section>
      )}
      {admin && !response.loading && !response.error && response.data.length > 0 && (
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
                        {order.buyer?.name || order.shipping.name}
                        <small>
                          {order.buyer?.email || order.shipping.email}
                        </small>
                      </td>
                    )}
                    <td data-label="Status" role="cell">
                      <span className="status-chip">
                        {orderStatusLabel(order.status)}
                      </span>
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
