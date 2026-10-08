import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { games } from '../../data/store'
import { useApiQuery } from '../../hooks/useApiQuery'
import { api, apiError } from '../../utils/api'
import { usePrototype } from '../../hooks/usePrototype'
import {
  catalogIdentity,
  importReviewErrors,
  prepareImports,
} from '../../utils/catalogImport'
import CardImage from '../../components/store/CardImage'

export default function AdminCardImportPage() {
  const { products, rememberProducts } = usePrototype()
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState([])
  const [review, setReview] = useState(false)
  const [values, setValues] = useState({})
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState([])
  const [revision, setRevision] = useState(0)
  const [saving, setSaving] = useState(false)
  const query = new URLSearchParams(params)
  if (!query.get('game')) query.set('game', 'pokemon')
  const response = useApiQuery(
    '/card-catalog/search',
    query.toString(),
    revision,
  )
  const sets = useApiQuery(
    '/card-catalog/sets',
    `game=${query.get('game')}`,
    revision,
  )
  const providers = useApiQuery('/card-catalog/providers', '', revision)
  const [previousQuery, setPreviousQuery] = useState(params.toString())
  if (previousQuery !== params.toString()) {
    setPreviousQuery(params.toString())
    setSelected([])
    setReview(false)
    setMessage('')
    setErrors([])
  }
  const available = response.data
  const duplicate = (card) =>
    products.some(
      (p) => p.source === card.source && p.externalId === card.externalId,
    )
  const update = (key, value) => {
    const next = new URLSearchParams(params)
    value ? next.set(key, value) : next.delete(key)
    if (key === 'game') next.delete('set')
    if (key !== 'page') next.delete('page')
    setParams(next)
    setSelected([])
    setReview(false)
    setMessage('')
    setErrors([])
  }
  const toggle = (card) => {
    const id = catalogIdentity(card)
    setSelected((current) =>
      current.some((c) => catalogIdentity(c) === id)
        ? current.filter((c) => catalogIdentity(c) !== id)
        : current.length < 5
          ? [...current, card]
          : current,
    )
    setMessage('')
  }
  const beginReview = () => {
    const next = {}
    for (const card of selected)
      next[catalogIdentity(card)] = {
        name: card.name || '',
        setName: card.setName || '',
        rarity: card.rarity || '',
        price: '',
        stock: '',
        condition: 'Near mint',
        isFeatured: false,
        description: '',
      }
    setValues(next)
    setErrors([])
    setReview(true)
  }
  const change = (id, key, value) =>
    setValues((current) => ({
      ...current,
      [id]: { ...current[id], [key]: value },
    }))
  const importCards = async (e) => {
    e.preventDefault()
    const result = prepareImports(selected, values, products)
    setErrors(result.errors)
    if (result.errors.length) {
      setMessage(
        'Correct the marked cards before importing. Nothing has been changed.',
      )
      return
    }
    setSaving(true)
    try {
      const response = await api.post('/admin/card-import', {
        items: selected.map((card) => ({
          source: card.source,
          externalId: card.externalId,
          values: {
            ...values[catalogIdentity(card)],
            price: Number(values[catalogIdentity(card)].price),
            stock: Number(values[catalogIdentity(card)].stock),
          },
        })),
      })
      const outcome = response.data.data
      rememberProducts(outcome.imported)
      setMessage(
        `${outcome.imported.length} cards imported. ${outcome.duplicates.length} duplicates skipped. ${outcome.errors.length} cards need attention.`,
      )
      setErrors(importReviewErrors(outcome.errors))
      const resolved = new Set([
        ...outcome.imported.map(catalogIdentity),
        ...outcome.duplicates.map((identity) =>
          typeof identity === 'string' ? identity : catalogIdentity(identity),
        ),
      ])
      setSelected((current) =>
        current.filter((card) => !resolved.has(catalogIdentity(card))),
      )
      if (!outcome.errors.length) setReview(false)
    } catch (error) {
      setMessage(apiError(error))
    } finally {
      setSaving(false)
    }
  }
  const blocked = response.loading || !!response.error
  return (
    <div className="admin-page">
      <header className="admin-heading">
        <div>
          <p className="eyebrow">03 / CATALOG IMPORT</p>
          <h1>Find it. Price it. Stock it.</h1>
        </div>
        <span className="status-chip">EXTERNAL CATALOG</span>
      </header>
      <div className="import-notice">
        <strong>Reference prices are not selling prices.</strong>
        <p>
          Provider references may be missing or stale. Enter your own PHP
          selling price and stock. No automatic currency conversion occurs.
        </p>
        <p>
          Import up to five cards at a time. Catalog searches use public
          providers. Optional JustTCG pricing is checked only when importing a
          new card, then saved as a reference snapshot. Existing inventory is
          not automatically repriced or refreshed.
        </p>
      </div>
      <p role="status">{message}</p>
      {providers.error && (
        <p role="alert">Provider status unavailable: {providers.error}</p>
      )}
      {!!providers.data.length && (
        <details className="import-notice">
          <summary>Provider configuration</summary>
          {providers.data.map((provider) => (
            <p key={provider.id || provider.source || provider.name}>
              {provider.name || provider.id || provider.source}:{' '}
              {provider.status ||
                (provider.configured === false
                  ? 'Not configured'
                  : 'Configured')}{' '}
              {provider.message || ''}
            </p>
          ))}
        </details>
      )}
      {review ? (
        <form className="import-review" noValidate onSubmit={importCards}>
          <div className="row-between">
            <h2>Review {selected.length} selected cards</h2>
            <button
              type="button"
              className="text-link"
              disabled={saving}
              onClick={() => setReview(false)}
            >
              Back to catalog
            </button>
          </div>
          {selected.map((card) => {
            const id = catalogIdentity(card)
            const entry = values[id]
            const failure = errors.find((e) => e.identity === id)
            const error = failure?.errors || {}
            return (
              <section className="editor-panel import-review-card" key={id}>
                <div className="review-art">
                  <CardImage src={card.imageUrl} name={card.name} />
                </div>
                <div>
                  <h3>{card.name}</h3>
                  <p className="muted">
                    {card.source} / {card.externalId}
                  </p>
                  <p>
                    Public provider reference:{' '}
                    {card.marketPrice == null
                      ? 'Unavailable'
                      : `${card.marketPrice} ${card.marketCurrency || 'Currency unavailable'} · ${card.marketUpdatedAt || 'Date unavailable'}`}
                  </p>
                  {failure?.message && (
                    <p role="alert" className="field-error">
                      {failure.message}
                    </p>
                  )}
                  <div className="form-grid">
                    {[
                      ['name', 'Card name'],
                      ['setName', 'Set'],
                      ['rarity', 'Rarity'],
                      ['price', 'Selling price (PHP)', 'number'],
                      ['stock', 'Stock quantity', 'number'],
                      ['condition', 'Condition'],
                      ['description', 'Store description'],
                    ].map(([key, label, type = 'text']) => (
                      <label key={key}>
                        {label}
                        {key !== 'description' && ' *'}
                        <input
                          type={type}
                          min={type === 'number' ? '0' : undefined}
                          step={
                            key === 'price'
                              ? '.01'
                              : type === 'number'
                                ? '1'
                                : undefined
                          }
                          value={entry[key]}
                          onChange={(e) => change(id, key, e.target.value)}
                          aria-invalid={!!error[key]}
                        />
                        {error[key] && (
                          <span className="field-error">{error[key]}</span>
                        )}
                      </label>
                    ))}
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={entry.isFeatured}
                        onChange={(e) =>
                          change(id, 'isFeatured', e.target.checked)
                        }
                      />
                      Featured in store
                    </label>
                  </div>
                </div>
              </section>
            )
          })}
          <button className="button button-primary" disabled={saving}>
            {saving ? 'Importing...' : 'Import reviewed cards'}
          </button>
          {!!errors.length && (
            <p role="alert" className="field-error">
              Complete required store values and any missing metadata.
            </p>
          )}
        </form>
      ) : (
        <>
          <div className="admin-toolbar">
            <label>
              Search catalog
              <input
                type="search"
                value={params.get('search') || ''}
                onChange={(e) => update('search', e.target.value)}
                placeholder="Name or card number"
              />
            </label>
            <label>
              Game
              <select
                value={params.get('game') || 'pokemon'}
                onChange={(e) => update('game', e.target.value)}
              >
                {games.map((g) => (
                  <option value={g.id} key={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Set
              <select
                value={params.get('set') || ''}
                onChange={(e) => update('set', e.target.value)}
              >
                <option value="">All sets</option>
                {sets.data.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button"
              onClick={() => {
                setSelected(available.filter((c) => !duplicate(c)).slice(0, 5))
                setMessage('')
              }}
              disabled={blocked || !available.some((c) => !duplicate(c))}
            >
              Select up to five visible
            </button>
            <button className="text-link" onClick={() => setSelected([])}>
              Clear selection
            </button>
          </div>
          {blocked || !available.length ? (
            <div
              className="empty-panel"
              role={response.loading ? 'status' : 'alert'}
            >
              <h2>
                {response.loading
                  ? 'Loading external catalog...'
                  : response.error || 'No catalog cards found.'}
              </h2>
              <p>Search another name or retry the provider request.</p>
              <button
                className="button"
                onClick={() => {
                  setRevision((v) => v + 1)
                }}
              >
                Try again
              </button>
            </div>
          ) : (
            <div className="import-grid">
              {available.map((card) => (
                <article
                  className={`import-card ${selected.some((c) => catalogIdentity(c) === catalogIdentity(card)) ? 'selected' : ''}`}
                  key={catalogIdentity(card)}
                >
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={selected.some(
                        (c) => catalogIdentity(c) === catalogIdentity(card),
                      )}
                      disabled={duplicate(card)}
                      onChange={() => toggle(card)}
                    />
                    {duplicate(card)
                      ? 'Already imported'
                      : `Select ${card.name}`}
                  </label>
                  <div className="import-art">
                    <CardImage src={card.imageUrl} name={card.name} />
                  </div>
                  <h2>{card.name}</h2>
                  <p>
                    {card.setName || 'Set missing · review required'} ·{' '}
                    {card.cardNumber || 'Card number unavailable'}
                  </p>
                  <small>
                    {card.rarity || 'Rarity missing · review required'}
                  </small>
                  <p className="market-ref">
                    Reference:{' '}
                    {card.marketPrice == null
                      ? 'Unavailable'
                      : `${card.marketPrice} ${card.marketCurrency}`}
                  </p>
                  <small>
                    {card.source} / {card.externalId}
                  </small>
                </article>
              ))}
            </div>
          )}
          <div className="import-selection-bar">
            <span>{selected.length} / 5 selected</span>
            <button
              className="button button-primary"
              disabled={!selected.length || blocked}
              onClick={beginReview}
            >
              Review selection →
            </button>
            <Link to="/admin/products">View store inventory</Link>
          </div>
          {sets.error && <p role="alert">Sets unavailable: {sets.error}</p>}
          <div className="form-actions">
            <button
              className="button"
              disabled={blocked || Number(params.get('page') || 1) <= 1}
              onClick={() =>
                update('page', String(Number(params.get('page') || 1) - 1))
              }
            >
              Previous page
            </button>
            <span>Page {response.meta.page || params.get('page') || 1}</span>
            <button
              className="button"
              disabled={blocked || !response.meta.hasMore}
              onClick={() =>
                update('page', String(Number(params.get('page') || 1) + 1))
              }
            >
              Next page
            </button>
          </div>
        </>
      )}
    </div>
  )
}
