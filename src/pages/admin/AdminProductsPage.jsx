import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { usePrototype } from '../../hooks/usePrototype'
import { formatPrice, games } from '../../data/store'
import { useApiQuery } from '../../hooks/useApiQuery'
import { apiError } from '../../utils/api'
import Pagination from '../../components/common/Pagination'
import Dialog from '../../components/common/Dialog'
import CardImage from '../../components/store/CardImage'
import '../../styles/admin-catalog.css'

export default function AdminProductsPage() {
  const { rememberProducts, setProductActive } = usePrototype()
  const [params, setParams] = useSearchParams()
  const [confirm, setConfirm] = useState(null)
  const [revision, setRevision] = useState(0)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const response = useApiQuery('/admin/products', params.toString(), revision)
  useEffect(() => {
    if (!response.loading && !response.error) rememberProducts(response.data)
  }, [response.data, response.loading, response.error, rememberProducts])
  const update = (key, value) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }
  const results = response.data
  const pages = response.meta.totalPages || 1
  const page = response.meta.page || 1
  return (
    <div className="admin-page">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">02 / INVENTORY</p>
          <h1>Every single, accounted for.</h1>
        </div>
        <div className="form-actions">
          <Link
            className="button"
            to="/admin/card-import"
            style={{ display: 'none' }}
          >
            Import cards
          </Link>
          <Link className="button button-primary" to="/admin/products/new">
            Add product +
          </Link>
        </div>
      </header>
      {params.get('saved') && (
        <p role="status">Product saved to store inventory.</p>
      )}
      <div className="admin-toolbar admin-sticky-filters">
        <label>
          Search
          <input
            type="search"
            placeholder="Card name, SKU, or set"
            value={params.get('search') || ''}
            onChange={(e) => update('search', e.target.value)}
          />
        </label>
        <label>
          Game
          <select
            value={params.get('game') || ''}
            onChange={(e) => update('game', e.target.value)}
          >
            <option value="">All games</option>
            {games.map((g) => (
              <option value={g.id} key={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select
            value={params.get('status') || ''}
            onChange={(e) => update('status', e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label>
          Stock
          <select
            value={params.get('stock') || ''}
            onChange={(e) => update('stock', e.target.value)}
          >
            <option value="">All stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
        </label>
        <label>
          Sort
          <select
            value={params.get('sort') || ''}
            onChange={(e) => update('sort', e.target.value)}
          >
            <option value="">Original order</option>
            <option value="name">Name</option>
            <option value="price">Price</option>
            <option value="stock">Stock</option>
          </select>
        </label>
        <button className="button" onClick={() => setParams({})}>
          Clear
        </button>
      </div>
      {response.loading || response.error ? (
        <div className="empty-panel" role={response.error ? 'alert' : 'status'}>
          {response.error || 'Loading inventory...'}
          <button className="button" onClick={() => setRevision((v) => v + 1)}>
            Try again
          </button>
        </div>
      ) : !results.length ? (
        <div className="empty-panel">
          <h2>No products match.</h2>
          <button className="button" onClick={() => setParams({})}>
            Clear filters
          </button>
        </div>
      ) : (
        <section aria-label="Store products">
          <div className="admin-product-grid">
            {results.map((p) => (
              <article className="product-card admin-product-card" key={p.id}>
                <Link className="product-media" to={`/admin/products/${p.id}/edit`} aria-label={`Edit ${p.name}`}>
                  <CardImage src={p.imageUrl} name={p.name} />
                </Link>
                <div className="product-meta">
                  <span>{p.gameName}</span>
                  <span className="status-chip">{p.isActive === false ? 'Archived' : 'Active'}</span>
                </div>
                <h2>{p.name}</h2>
                <p className="product-set">{p.setName}</p>
                <p className="product-condition">{p.rarity} · {p.condition}</p>
                <p className="admin-product-sku">{p.sku}</p>
                <div className="product-bottom">
                  <strong>{formatPrice(p.price)}</strong>
                  <span className={p.stock <= p.lowStockThreshold ? 'stock-low' : ''}>{p.stock} in stock</span>
                </div>
                <div className="admin-product-actions">
                  <Link className="button" to={`/admin/products/${p.id}/edit`}>Edit<span className="sr-only"> {p.name}</span></Link>
                  <button className="button" onClick={() => setConfirm(p)}>
                    {p.isActive === false ? 'Restore' : 'Archive'}<span className="sr-only"> {p.name}</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
          <Pagination
            page={page}
            pages={pages}
            onChange={(p) => update('page', String(p))}
          />
        </section>
      )}
      {actionError && (
        <p role="alert" className="field-error">
          {actionError}
        </p>
      )}
      <Dialog
        open={!!confirm}
        onClose={() => {
          if (!saving) setConfirm(null)
        }}
        labelledBy="inventory-confirm"
      >
        <h2 id="inventory-confirm">
          {`${confirm?.isActive === false ? 'Restore' : 'Archive'} ${confirm?.name || 'card'}?`}
        </h2>
        <p>
          Archiving hides a card from the store. Existing cart lines will need
          attention. You can restore it here.
        </p>
        <button
          className="button button-primary"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            setActionError('')
            try {
              await setProductActive(confirm.id, confirm.isActive === false)
              setConfirm(null)
              setRevision((v) => v + 1)
            } catch (e) {
              setActionError(apiError(e))
            } finally {
              setSaving(false)
            }
          }}
        >
          {saving ? 'Saving...' : 'Confirm'}
        </button>
        {actionError && (
          <p role="alert" className="field-error">
            {actionError}
          </p>
        )}
      </Dialog>
    </div>
  )
}
