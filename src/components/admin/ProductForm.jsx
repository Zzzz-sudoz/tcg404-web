import { useState } from 'react'
import { games } from '../../data/store'
import { apiError, apiFields } from '../../utils/api'
import { validateProduct } from '../../utils/productValidation'
import CardImage from '../store/CardImage'
import SavedReference from '../store/SavedReference'

export default function ProductForm({ initial, products, onSave, onCancel }) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const change = (key, value) =>
    setValues((current) => ({ ...current, [key]: value }))
  const fields = [
    ['name', 'Card name'],
    ['sku', 'Store SKU'],
    ['setName', 'Set'],
    ['cardNumber', 'Card number'],
    ['rarity', 'Rarity'],
    ['condition', 'Condition'],
    ['slug', 'URL slug'],
    ['price', 'Selling price (PHP)', 'number'],
    ['stock', 'Stock quantity', 'number'],
    ['lowStockThreshold', 'Low stock threshold', 'number'],
    ['imageUrl', 'Artwork URL or local path'],
  ]
  return (
    <form
      className="product-editor"
      noValidate
      onSubmit={async (e) => {
        e.preventDefault()
        const result = validateProduct(values, products, initial.id)
        setErrors(result.errors)
        if (Object.keys(result.errors).length) return
        setSaving(true)
        setMessage('')
        try {
          await onSave(result.product)
        } catch (error) {
          setErrors(apiFields(error))
          setMessage(apiError(error))
        } finally {
          setSaving(false)
        }
      }}
    >
      <section className="editor-panel">
        <h2>Card identity & store details</h2>
        <p className="muted">
          Artwork and catalog details describe the card. Selling price and stock
          belong to your store.
        </p>
        <div className="form-grid">
          <label>
            Game
            <select
              value={values.game}
              onChange={(e) => change('game', e.target.value)}
            >
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          </label>
          {fields.map(([key, label, type = 'text']) => (
            <label key={key}>
              {label}
              {!['cardNumber', 'slug', 'imageUrl'].includes(key) && ' *'}
              <input
                type={type}
                min={type === 'number' ? '0' : undefined}
                step={
                  key === 'price' ? '.01' : type === 'number' ? '1' : undefined
                }
                value={values[key] ?? ''}
                onChange={(e) => change(key, e.target.value)}
                aria-invalid={!!errors[key]}
                aria-describedby={errors[key] ? `error-${key}` : undefined}
              />
              {errors[key] && (
                <span className="field-error" id={`error-${key}`}>
                  {errors[key]}
                </span>
              )}
            </label>
          ))}
        </div>
        <label>
          Description
          <textarea
            value={values.description || ''}
            onChange={(e) => change('description', e.target.value)}
          />
        </label>
        <div className="form-pair">
          <label className="check-label">
            <input
              type="checkbox"
              checked={!!values.isFeatured}
              onChange={(e) => change('isFeatured', e.target.checked)}
            />
            Featured
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={values.isActive !== false}
              onChange={(e) => change('isActive', e.target.checked)}
            />
            Active in store
          </label>
        </div>
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="field-error">
            Please correct the marked fields.
          </p>
        )}
        <div className="form-actions">
          <button className="button button-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save product'}
          </button>
          <button
            type="button"
            className="button"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
        {message && (
          <p role="alert" className="field-error">
            {message}
          </p>
        )}
      </section>
      <aside className="admin-panel product-proof">
        <p className="eyebrow">ARTWORK PROOF</p>
        <div className="proof-art">
          <CardImage
            key={values.imageUrl}
            src={
              /^https:\/\//.test(values.imageUrl || '') ||
              /^\/(?!\/)/.test(values.imageUrl || '')
                ? values.imageUrl
                : ''
            }
            name={values.name || 'Your card'}
          />
        </div>
        <h2>{values.name || 'Your next single'}</h2>
        <p>{values.setName || 'Set not entered'}</p>
        {initial.source === 'demo-fallback' && (
          <p className="prototype-note">
            Sample inventory. Initial price and stock are demo values.
          </p>
        )}
        <SavedReference product={initial} />
        <p className="prototype-note">
          Saved changes persist in store inventory. Artwork uses a URL or local
          asset path.
        </p>
      </aside>
    </form>
  )
}
