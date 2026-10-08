import Icon from '../../components/common/Icon'
import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { formatPrice, games } from '../../data/store'
import { useApiQuery } from '../../hooks/useApiQuery'
import { chartPoints, validateDateRange } from '../../utils/operations'
import QueryState from '../../components/common/QueryState'

function InsightList({ products, type }) {
  return (
    <ul className="insight-list">
      {products.map(product => (
        <li key={product.productId}>
          <Link to={`/admin/inventory?search=${encodeURIComponent(product.name)}`}>
            {product.name}
          </Link>
          <small>
            {type === 'lowStockRisks'
              ? `${product.stock} in stock · threshold ${product.threshold}`
              : `${product.units} completed units in 30 days · ${product.stock} in stock`}
          </small>
        </li>
      ))}
    </ul>
  )
}

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
      <p>{data.method} · Completed order value, including unpaid orders.</p>
      <p className="muted">Solid: observed · Dashed: projected · PHP</p>
      <svg
        className={`forecast-chart ${all.some((row) => row.value > 0) ? '' : 'is-empty'}`}
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
        <p>No completed sales in the last seven days.</p>
      )}
      <details>
        <summary>Daily forecast values</summary>
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
            <InsightList products={data.insights[key].slice(0, 4)} type={key} />
            {data.insights[key].length > 4 && (
              <details>
                <summary>{data.insights[key].length - 4} more singles</summary>
                <InsightList products={data.insights[key].slice(4)} type={key} />
              </details>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

const analyticsViews = [
  ['sales', 'Sales', 'analytics'],
  ['games', 'Games', 'cards'],
  ['bestsellers', 'Best sellers', 'overview'],
  ['orders', 'Orders', 'bag'],
  ['forecast', 'Forecast', 'inventory'],
]

function SalesChart({ data }) {
  const maximum = Math.max(
    1,
    ...data.trend.map((day) => Math.max(day.orderValue, day.revenue)),
  )
  return (
    <section className="admin-panel analytics-panel">
      <div className="panel-heading">
        <h2>Sales over time</h2>
        <div className="chart-legend">
          <span>Completed value</span>
          <span>Paid revenue</span>
        </div>
      </div>
      <svg
        className={`sales-chart ${data.trend.some((day) => day.orderValue || day.revenue) ? '' : 'is-empty'}`}
        viewBox="0 0 400 190"
        role="img"
        aria-label="Daily completed order value and paid revenue. Exact values are available below."
      >
        <line x1="24" y1="156" x2="376" y2="156" className="chart-axis" />
        <line x1="24" y1="90" x2="376" y2="90" className="chart-guide" />
        <line x1="24" y1="24" x2="376" y2="24" className="chart-guide" />
        <text x="24" y="16">
          {formatPrice(maximum)}
        </text>
        <text x="24" y="180">
          {data.trend[0]?.date}
        </text>
        <text x="376" y="180" textAnchor="end">
          {data.trend.at(-1)?.date}
        </text>
        <polyline
          points={chartPoints(
            data.trend.map((day) => ({ value: day.orderValue })),
            0,
            data.trend.length,
            maximum,
          )}
          className="chart-observed"
        />
        <polyline
          points={chartPoints(
            data.trend.map((day) => ({ value: day.revenue })),
            0,
            data.trend.length,
            maximum,
          )}
          className="chart-paid"
        />
      </svg>
      {!data.trend.some((day) => day.orderValue || day.revenue) && (
        <p className="analytics-empty">No completed sales in this period.</p>
      )}
      <details>
        <summary>Daily values</summary>
        <div
          className="table-scroll"
          role="region"
          tabIndex={0}
          aria-label="Daily sales values"
        >
          <table>
            <thead>
              <tr>
                <th scope="col">UTC date</th>
                <th scope="col">Paid revenue</th>
                <th scope="col">Completed value</th>
                <th scope="col">Orders</th>
                <th scope="col">Units</th>
              </tr>
            </thead>
            <tbody>
              {data.trend.map((day) => (
                <tr key={day.date}>
                  <td>{day.date}</td>
                  <td>{formatPrice(day.revenue)}</td>
                  <td>{formatPrice(day.orderValue)}</td>
                  <td>{day.orders}</td>
                  <td>{day.unitsSold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  )
}

function GameChart({ data }) {
  const max = Math.max(1, ...data.byGame.map((game) => game.unitsSold))
  return (
    <section className="admin-panel analytics-panel">
      <div className="panel-heading">
        <h2>Demand by game</h2>
        <span className="panel-unit">Completed units</span>
      </div>
      {!data.byGame.length && (
        <p className="analytics-empty">No completed sales in this period.</p>
      )}
      <ul className="game-demand-list">
        {data.byGame.map((game) => (
          <li className={`demand-${game.game}`} key={game.game}>
            <div className="row-between">
              <strong>
                {games.find((item) => item.id === game.game)?.name || game.game}
              </strong>
              <span>{game.unitsSold} units</span>
            </div>
            <div className="demand-track" aria-hidden="true">
              <span style={{ width: `${(game.unitsSold / max) * 100}%` }} />
            </div>
            <small>{formatPrice(game.revenue)} paid revenue</small>
          </li>
        ))}
      </ul>
    </section>
  )
}

function BestSellers({ data }) {
  return (
    <section className="admin-panel analytics-panel">
      <div className="panel-heading">
        <h2>Most collected</h2>
        <span className="panel-unit">Completed orders</span>
      </div>
      {!data.topProducts.length && (
        <p className="analytics-empty">No completed sales in this period.</p>
      )}
      <ol className="ranked-list">
        {data.topProducts.map((product, index) => (
          <li key={product.productId}>
            <span className="rank-position">
              {String(index + 1).padStart(2, '0')}
            </span>
            <Link
              to={`/admin/inventory?search=${encodeURIComponent(product.name)}`}
            >
              {product.name}
              <small>{formatPrice(product.revenue)} paid revenue</small>
            </Link>
            <strong>
              {product.unitsSold}
              <small>units</small>
            </strong>
          </li>
        ))}
      </ol>
    </section>
  )
}

function RecentOrders({ data, statuses = false }) {
  return (
    <section className="admin-panel analytics-panel">
      <div className="panel-heading">
        <h2>Recent orders</h2>
        <Link className="text-link" to="/admin/orders">
          View all <Icon name="arrow" />
        </Link>
      </div>
      {statuses && (
        <div className="order-status-grid">
          {Object.entries(data.statuses).map(([status, count]) => (
            <div key={status} className={`order-status status-${status}`}>
              <span>{status}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      )}
      {!data.recentOrders.length && (
        <p className="analytics-empty">No orders in this period.</p>
      )}
      <ul className="recent-order-list">
        {data.recentOrders.map((order) => (
          <li key={order.id}>
            <span className="order-list-icon">
              <Icon name="bag" />
            </span>
            <Link to={`/admin/orders/${order.id}`}>
              {order.orderNumber}
              <small className={`order-state state-${order.status}`}>
                {order.status}
              </small>
            </Link>
            <strong>{formatPrice(order.total)}</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function AdminDashboardPage() {
  const [params, setParams] = useSearchParams()
  const { pathname } = useLocation()
  const analytics = pathname === '/admin/analytics'
  const view = analyticsViews.some(([key]) => key === params.get('view'))
    ? params.get('view')
    : 'sales'
  const [revision, setRevision] = useState(0)
  const [error, setError] = useState('')
  const query = new URLSearchParams(
    [...params].filter(([key]) => ['from', 'to'].includes(key)),
  ).toString()
  const response = useApiQuery('/admin/analytics', query, revision)
  const data = response.data
  const selectView = (key) => {
    const next = new URLSearchParams(params)
    next.set('view', key)
    setParams(next, { replace: true, preventScrollReset: true })
  }
  const handleTabKey = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const tabs = [...event.currentTarget.querySelectorAll('[role=tab]')]
    const index = tabs.indexOf(document.activeElement)
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) %
            tabs.length
    tabs[next].focus()
    selectView(tabs[next].dataset.view)
  }
  const filter = (event) => {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    const issue = validateDateRange(values.from, values.to)
    setError(issue)
    if (!issue)
      setParams({
        ...(analytics ? { view } : {}),
        ...Object.fromEntries(
          Object.entries(values).filter(([, value]) => value),
        ),
      })
  }
  return (
    <div className="admin-page dashboard-page">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">COLLECTOR OPERATIONS</p>
          <h1>{analytics ? 'Analytics.' : 'Store overview.'}</h1>
        </div>
        <Link className="button button-secondary" to="/admin/orders">
          <Icon name="bag" />
          Manage orders
        </Link>
      </header>
      <form
        className="admin-toolbar analytics-date-form"
        onSubmit={filter}
        key={query}
      >
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
          className="button button-secondary"
          onClick={() => {
            setError('')
            setParams(analytics ? { view } : {})
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
      <QueryState
        response={response}
        retry={() => setRevision((value) => value + 1)}
      />
      {!response.loading && !response.error && (
        <>
          <p className="analytics-range">
            <span>UTC RANGE</span>
            <time dateTime={data.range.from}>{data.range.from}</time>
            <span aria-hidden="true">—</span>
            <time dateTime={data.range.to}>{data.range.to}</time>
          </p>
          <div className="metric-grid">
            {[
              [
                'Paid revenue',
                formatPrice(data.revenue),
                'Completed and paid orders',
                'analytics',
                'gold',
              ],
              [
                'Completed value',
                formatPrice(data.orderValue),
                'Includes unpaid completed orders',
                'cards',
                'mint',
              ],
              [
                'Orders created',
                data.orders,
                'All order statuses',
                'bag',
                'lavender',
              ],
              [
                'Average order',
                formatPrice(data.averageOrderValue),
                'Completed order value',
                'overview',
                'lavender',
              ],
              [
                'Units sold',
                data.unitsSold,
                'Completed orders',
                'cards',
                'gold',
              ],
              [
                'Low stock / out',
                `${data.inventory.lowStock} / ${data.inventory.outOfStock}`,
                `${data.inventory.active} active products`,
                'inventory',
                'coral',
              ],
            ]
              .filter((_, index) => !analytics || index < 3)
              .map(([label, value, hint, icon, tone]) => (
                <article className={`metric metric-${tone}`} key={label}>
                  <div className="metric-label">
                    <span>{label}</span>
                    <Icon name={icon} />
                  </div>
                  <strong>{value}</strong>
                  <small>{hint}</small>
                </article>
              ))}
          </div>
          {analytics ? (
            <>
              <div
                className="analytics-tabs"
                role="tablist"
                aria-label="Analytics views"
                onKeyDown={handleTabKey}
              >
                {analyticsViews.map(([key, label, icon]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    id={`tab-${key}`}
                    data-view={key}
                    aria-selected={view === key}
                    aria-controls="analytics-panel"
                    tabIndex={view === key ? 0 : -1}
                    onClick={() => selectView(key)}
                  >
                    <Icon name={icon} />
                    {label}
                  </button>
                ))}
              </div>
              <div
                role="tabpanel"
                className="analytics-view"
                id="analytics-panel"
                data-view={view}
                aria-labelledby={`tab-${view}`}
                tabIndex={0}
              >
                {view === 'sales' && <SalesChart data={data} />}
                {view === 'games' && <GameChart data={data} />}
                {view === 'bestsellers' && <BestSellers data={data} />}
                {view === 'orders' && <RecentOrders data={data} statuses />}
                {view === 'forecast' && <ForecastPanel />}
              </div>
            </>
          ) : (
            <div className="overview-panels">
              <SalesChart data={data} />
              <RecentOrders data={data} />
              <Link className="text-link" to="/admin/analytics">
                Explore analytics <Icon name="arrow" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
