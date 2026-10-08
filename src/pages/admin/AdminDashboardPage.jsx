import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { formatPrice } from '../../data/store'
import { useApiQuery } from '../../hooks/useApiQuery'
import { chartPoints, validateDateRange } from '../../utils/operations'
import QueryState from '../../components/common/QueryState'

function ForecastPanel() {
  const [revision, setRevision] = useState(0)
  const response = useApiQuery('/admin/forecast', '', revision)
  const data = response.data
  if (response.loading || response.error)
    return (
      <section className="admin-panel">
        <h2>Projected order value</h2>
        <QueryState
          response={response}
          retry={() => setRevision((v) => v + 1)}
        />
      </section>
    )
  const all = [...data.history, ...data.forecast]
  const max = Math.max(1, ...all.map((row) => row.value))
  const observed = chartPoints(data.history, 0, all.length, max)
  const projected = chartPoints(
    [data.history.at(-1), ...data.forecast],
    data.history.length - 1,
    all.length,
    max,
  )
  return (
    <section className="admin-panel forecast-panel">
      <div className="row-between">
        <h2>Projected order value</h2>
        <strong>{formatPrice(data.dailyAverage)} / day</strong>
      </div>
      <p>
        {data.method} using the last seven full UTC days of completed order
        value, including unpaid orders. Each of the next seven days uses the
        same daily average.
      </p>
      <p className="muted">
        Solid line: observed · Dashed line: projected · PHP. This is a simple
        projection, not paid revenue.
      </p>
      <svg
        className="forecast-chart"
        viewBox="0 0 400 190"
        role="img"
        aria-label="Observed and projected completed order value. Exact dates and values follow in the table."
      >
        <line x1="24" y1="156" x2="376" y2="156" className="chart-axis" />
        <text x="24" y="16">
          {formatPrice(max)}
        </text>
        <text x="24" y="180">
          {data.history[0]?.date}
        </text>
        <text x="376" y="180" textAnchor="end">
          {data.forecast.at(-1)?.date}
        </text>
        <polyline points={observed} className="chart-observed" />
        <polyline points={projected} className="chart-projected" />
      </svg>
      {!all.some((row) => row.value > 0) && (
        <p>
          No completed order value in the observed seven days. The projection is
          zero.
        </p>
      )}
      <details>
        <summary>Daily forecast values</summary>
        <p className="scroll-hint">
          Scroll horizontally for all columns. Keyboard: focus the table area
          and use arrow keys.
        </p>
        <div
          className="table-scroll"
          role="region"
          tabIndex={0}
          aria-label="Daily forecast values; scroll horizontally for all columns"
        >
          <table>
            <thead>
              <tr>
                <th scope="col">UTC date</th>
                <th scope="col">Basis</th>
                <th scope="col">Order value</th>
              </tr>
            </thead>
            <tbody>
              {all.map((row, i) => (
                <tr key={row.date}>
                  <td>{row.date}</td>
                  <td>{i < data.history.length ? 'Observed' : 'Projected'}</td>
                  <td>{formatPrice(row.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <div className="stock-insights">
        {[
          ['Fast-moving singles', 'fastMoving'],
          ['Slow-moving singles', 'slowMoving'],
          ['Low-stock risks', 'lowStockRisks'],
        ].map(([title, key]) => (
          <div key={key}>
            <h3>{title}</h3>
            {!data.insights[key].length && <p>No matching inventory.</p>}
            {data.insights[key].map((product) => (
              <p key={product.productId}>
                <Link
                  to={`/admin/inventory?search=${encodeURIComponent(product.name)}`}
                >
                  {product.name}
                </Link>
                <small>
                  {key === 'lowStockRisks'
                    ? `${product.stock} in stock · threshold ${product.threshold}`
                    : `${product.units} completed units in 30 days · ${product.stock} in stock`}
                </small>
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export default function AdminDashboardPage() {
  const [params, setParams] = useSearchParams()
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const query = new URLSearchParams(
    [...params].filter(([key]) => ['from', 'to'].includes(key)),
  ).toString()
  const response = useApiQuery('/admin/analytics', query, revision)
  const data = response.data
  const trend = useRef(null)
  useEffect(() => {
    if (trend.current && !response.loading && !response.error)
      trend.current.scrollLeft = trend.current.scrollWidth
  }, [response.loading, response.error, data])
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
    <div className="admin-page">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">COLLECTOR OPERATIONS</p>
          <h1>The collection, in numbers.</h1>
          <p>
            Stored orders and current inventory. The default period is the last
            30 UTC days.
          </p>
        </div>
        <Link className="button" to="/admin/orders">
          Manage orders
        </Link>
      </header>
      <form className="admin-toolbar" onSubmit={filter} key={query}>
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
          <input name="to" type="date" defaultValue={params.get('to') || ''} />
        </label>
        <button className="button button-primary">Apply dates</button>
        <button
          type="button"
          className="button"
          onClick={() => {
            setError('')
            setParams({})
          }}
        >
          Last 30 days
        </button>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </form>
      <QueryState response={response} retry={() => setRevision((v) => v + 1)} />
      {!response.loading && !response.error && (
        <>
          <p className="muted">
            UTC range: {data.range.from} to {data.range.to}, inclusive.
          </p>
          <div className="metric-grid">
            {[
              [
                'Paid revenue',
                formatPrice(data.revenue),
                'Completed and paid orders only',
              ],
              [
                'Completed order value',
                formatPrice(data.orderValue),
                'Completed totals, including unpaid orders',
              ],
              [
                'Orders created',
                data.orders,
                'All statuses in this date range',
              ],
              [
                'Average completed order',
                formatPrice(data.averageOrderValue),
                'Completed totals, including unpaid orders',
              ],
              ['Units sold', data.unitsSold, 'Completed order quantities'],
              [
                'Low stock / out',
                `${data.inventory.lowStock} / ${data.inventory.outOfStock}`,
                `${data.inventory.active} active inventory records`,
              ],
            ].map(([label, value, hint]) => (
              <article className="metric" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{hint}</small>
              </article>
            ))}
          </div>
          {data.orders === 0 && (
            <p className="empty-panel">
              No orders were created in this period. Metrics show zero activity.
            </p>
          )}
          <div className="dashboard-grid">
            <section className="admin-panel">
              <h2>Daily order value</h2>
              <p className="muted">
                Completed totals including unpaid orders. Daily paid revenue is
                shown separately. The view starts at the latest dates; scroll
                horizontally for earlier days.
              </p>
              <div
                ref={trend}
                tabIndex={0}
                className="revenue-chart"
                role="region"
                aria-label="Daily completed order value. Scroll horizontally for earlier dates."
              >
                {data.trend.map((row) => (
                  <div className="chart-column" key={row.date}>
                    <strong>{formatPrice(row.orderValue)}</strong>
                    <div className="bar-track">
                      <span
                        style={{
                          height: `${(row.orderValue / Math.max(1, ...data.trend.map((day) => day.orderValue))) * 100}%`,
                        }}
                      />
                    </div>
                    <small>{row.date.slice(5)}</small>
                  </div>
                ))}
              </div>
              <details>
                <summary>Daily analytics values</summary>
                <p className="scroll-hint">
                  Scroll horizontally for all columns. Keyboard: focus the table
                  area and use arrow keys.
                </p>
                <div
                  className="table-scroll"
                  role="region"
                  tabIndex={0}
                  aria-label="Daily analytics values; scroll horizontally for all columns"
                >
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">UTC date</th>
                        <th scope="col">Paid revenue</th>
                        <th scope="col">Completed order value</th>
                        <th scope="col">Orders</th>
                        <th scope="col">Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.trend.map((row) => (
                        <tr key={row.date}>
                          <td>{row.date}</td>
                          <td>{formatPrice(row.revenue)}</td>
                          <td>{formatPrice(row.orderValue)}</td>
                          <td>{row.orders}</td>
                          <td>{row.unitsSold}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </section>
            <section className="admin-panel">
              <h2>Completed demand by game</h2>
              {!data.byGame.length && (
                <p>No completed demand in this period.</p>
              )}
              {data.byGame.map((game) => (
                <p key={game.game}>
                  {game.game}
                  <small>
                    {game.unitsSold} units · {formatPrice(game.revenue)} paid
                    revenue
                  </small>
                </p>
              ))}
              <h3>Most collected</h3>
              {!data.topProducts.length && (
                <p>No completed singles in this period.</p>
              )}
              {data.topProducts.map((product) => (
                <p key={product.productId}>
                  {product.name}
                  <small>
                    {product.unitsSold} units · {formatPrice(product.revenue)}{' '}
                    paid revenue
                  </small>
                </p>
              ))}
              <h3>Order statuses</h3>
              {Object.entries(data.statuses).map(([status, count]) => (
                <p key={status}>
                  {status}: <strong>{count}</strong>
                </p>
              ))}
            </section>
            <section className="admin-panel">
              <h2>Recent saved orders</h2>
              {!data.recentOrders.length && <p>No orders in this period.</p>}
              {data.recentOrders.map((order) => (
                <div className="row-between" key={order.id}>
                  <Link to={`/admin/orders/${order.id}`}>
                    {order.orderNumber}
                  </Link>
                  <span>
                    {order.status} · {formatPrice(order.total)}
                  </span>
                </div>
              ))}
            </section>
          </div>
        </>
      )}
      <ForecastPanel />
    </div>
  )
}
