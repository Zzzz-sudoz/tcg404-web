import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useApiQuery } from '../../hooks/useApiQuery'
import { api, apiError, apiFields } from '../../utils/api'
import { validateStock } from '../../utils/operations'
import { reconcileStockDraft } from '../../utils/inventory'
import QueryState from '../../components/common/QueryState'
import Pagination from '../../components/common/Pagination'

function StockEditor({ product, refresh, onSaved }) {
  const [draft, setDraft] = useState(() => reconcileStockDraft(null, product))
  const reconciled = reconcileStockDraft(draft, product)
  if (reconciled !== draft) setDraft(reconciled)
  const { stock, lowStockThreshold: threshold, note } = reconciled
  const edit = (key, value) =>
    setDraft((current) => ({ ...current, [key]: value, dirty: true }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({})
  const [message, setMessage] = useState('')
  const pending = useRef(false)
  const feedback = useRef(null)
  const submit = async (event) => {
    event.preventDefault()
    if (pending.current) return
    const issues = validateStock(stock, threshold)
    setFields(issues)
    setError('')
    setMessage('')
    if (Object.keys(issues).length) {
      setError('Correct the stock fields.')
      feedback.current?.focus()
      return
    }
    pending.current = true
    setSaving(true)
    try {
      const { data } = await api.patch(`/admin/inventory/${product.id}`, {
        stock: Number(stock),
        lowStockThreshold: Number(threshold),
        note: note.trim(),
        revision: draft.revision,
      })
      setDraft({
        ...reconcileStockDraft(null, data.data),
        seenRevision: product.revision,
      })
      setMessage('Inventory saved.')
      onSaved()
    } catch (e) {
      setError(apiError(e))
      setFields(apiFields(e))
      feedback.current?.focus()
    } finally {
      pending.current = false
      setSaving(false)
    }
  }
  return (
    <form
      className="stock-editor"
      onSubmit={submit}
      noValidate
      aria-label={`Edit inventory for ${product.name}`}
    >
      <div>
        <Link to={`/admin/products/${product.id}/edit`}>
          <strong>{product.name}</strong>
        </Link>
        <small>
          {product.sku} · Loaded stock: {product.stock}
        </small>
        <Link to={`/admin/inventory/movements?productId=${product.id}`}>
          Movement history
        </Link>
      </div>
      <label htmlFor={`stock-${product.id}`}>
        Stock
        <input
          id={`stock-${product.id}`}
          name="stock"
          type="number"
          min="0"
          max={Number.MAX_SAFE_INTEGER}
          step="1"
          required
          disabled={saving}
          value={stock}
          onChange={(e) => edit('stock', e.target.value)}
          aria-invalid={!!fields.stock}
          aria-describedby={
            fields.stock ? `stock-error-${product.id}` : undefined
          }
        />
        {fields.stock && (
          <span className="field-error" id={`stock-error-${product.id}`}>
            {fields.stock}
          </span>
        )}
      </label>
      <label htmlFor={`threshold-${product.id}`}>
        Low-stock threshold
        <input
          id={`threshold-${product.id}`}
          name="lowStockThreshold"
          type="number"
          min="0"
          max={Number.MAX_SAFE_INTEGER}
          step="1"
          required
          disabled={saving}
          value={threshold}
          onChange={(e) => edit('lowStockThreshold', e.target.value)}
          aria-invalid={!!fields.lowStockThreshold}
          aria-describedby={
            fields.lowStockThreshold
              ? `threshold-error-${product.id}`
              : undefined
          }
        />
        {fields.lowStockThreshold && (
          <span className="field-error" id={`threshold-error-${product.id}`}>
            {fields.lowStockThreshold}
          </span>
        )}
      </label>
      <label>
        Adjustment note
        <input
          maxLength={500}
          disabled={saving}
          value={note}
          onChange={(e) => edit('note', e.target.value)}
        />
      </label>
      <button className="button button-primary" disabled={saving}>
        {saving ? 'Saving...' : 'Save inventory'}
      </button>
      {message && <p role="status">{message}</p>}
      <p
        className="field-error"
        ref={feedback}
        tabIndex={-1}
        role={error ? 'alert' : undefined}
      >
        {error}
      </p>
      {error && (
        <button
          type="button"
          className="button"
          disabled={saving}
          onClick={() => {
            setDraft(reconcileStockDraft(null, product))
            setError('')
            setFields({})
            refresh()
          }}
        >
          Reload inventory
        </button>
      )}
    </form>
  )
}

export default function AdminInventoryPage({ movements = false }) {
  const [params, setParams] = useSearchParams()
  const [revision, setRevision] = useState(0)
  const [snapshot, setSnapshot] = useState(null)
  const [message, setMessage] = useState('')
  const viewKey = `${movements}:${params.toString()}`
  const response = useApiQuery(
    movements ? '/admin/inventory/movements' : '/admin/inventory',
    params.toString(),
    revision,
  )
  if (!response.loading && !response.error && snapshot?.response !== response)
    setSnapshot({ response, key: viewKey })
  const view =
    response.loading || response.error
      ? snapshot?.key === viewKey
        ? snapshot.response
        : response
      : response
  const refresh = () => setRevision((v) => v + 1)
  const saved = () => {
    setMessage('Inventory saved.')
    refresh()
  }
  const filter = (event) => {
    event.preventDefault()
    setParams(
      Object.fromEntries(
        [...new FormData(event.currentTarget)].filter(([, value]) => value),
      ),
    )
  }
  const page = (value) => {
    const next = new URLSearchParams(params)
    next.set('page', value)
    setParams(next)
  }
  return (
    <div className="admin-page">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">COLLECTOR OPERATIONS</p>
          <h1>
            {movements ? 'Inventory movements.' : 'Stock, on the record.'}
          </h1>
          <p>
            {movements
              ? 'Saved adjustments, sales and cancellations. Historical inventory has no fabricated movement history.'
              : 'Save absolute stock and alert thresholds together. Stale edits cannot overwrite a sale.'}
          </p>
        </div>
        <Link
          className="button"
          to={movements ? '/admin/inventory' : '/admin/inventory/movements'}
        >
          {movements ? 'Back to inventory' : 'View movement history'}
        </Link>
      </header>
      {!movements && view.meta.counts && (
        <p className="inventory-counts">
          Active: {view.meta.counts.active ?? view.meta.counts.total} · Low
          stock: {view.meta.counts.lowStock} · Out of stock:{' '}
          {view.meta.counts.outOfStock}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      <form className="admin-toolbar" key={params.toString()} onSubmit={filter}>
        {movements ? (
          <>
            <label>
              Product ID
              <input
                name="productId"
                maxLength={24}
                defaultValue={params.get('productId') || ''}
              />
            </label>
            <label>
              Movement type
              <select name="type" defaultValue={params.get('type') || ''}>
                <option value="">All types</option>
                {['initial', 'manual', 'sale', 'cancellation'].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            <label>
              Search inventory
              <input
                name="search"
                type="search"
                maxLength={100}
                defaultValue={params.get('search') || ''}
              />
            </label>
            <label>
              Stock filter
              <select name="stock" defaultValue={params.get('stock') || 'all'}>
                <option value="all">All stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
              </select>
            </label>
          </>
        )}
        <button className="button button-primary">Apply filters</button>
        <button type="button" className="button" onClick={() => setParams({})}>
          Clear filters
        </button>
      </form>
      <QueryState
        response={response}
        retry={refresh}
        empty={
          movements
            ? 'No stock movements in this view.'
            : 'No active inventory in this view.'
        }
      />
      {view.data.length > 0 && (
        <section className="admin-panel">
          {movements ? (
            <>
              <p className="scroll-hint">
                Scroll horizontally for all columns. Keyboard: focus the table
                area and use arrow keys.
              </p>
              <div
                className="table-scroll"
                role="region"
                tabIndex={0}
                aria-label="Stock movement history; scroll horizontally for all columns"
              >
                <table>
                  <caption className="sr-only">
                    Immutable stock movement history
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Product</th>
                      <th scope="col">Type</th>
                      <th scope="col">Change</th>
                      <th scope="col">Before / after</th>
                      <th scope="col">Note / actor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.data.map((movement) => (
                      <tr key={movement.id}>
                        <td>{new Date(movement.createdAt).toLocaleString()}</td>
                        <td>{movement.productName}</td>
                        <td>{movement.type}</td>
                        <td>
                          {movement.quantityChange > 0 ? '+' : ''}
                          {movement.quantityChange}
                        </td>
                        <td>
                          {movement.stockBefore} / {movement.stockAfter}
                        </td>
                        <td>
                          {movement.note || 'No note'}
                          <small>{movement.createdBy || 'System'}</small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            view.data.map((product) => (
              <StockEditor
                key={product.id}
                product={product}
                refresh={refresh}
                onSaved={saved}
              />
            ))
          )}
          <Pagination
            page={view.meta.page || 1}
            pages={view.meta.totalPages || 1}
            onChange={page}
          />
        </section>
      )}
    </div>
  )
}
