import { useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router'
import { games, formatPrice } from '../../data/store'
import { apiError, apiFields } from '../../utils/api'
import { validateProduct } from '../../utils/productValidation'
import CardImage from '../store/CardImage'
import SavedReference from '../store/SavedReference'
import Dialog from '../common/Dialog'
import { productHasChanges } from '../../utils/productChanges'
import '../../styles/admin-catalog.css'

export default function ProductForm({ initial, products, onSave, onSaved, onCancel }) {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [review, setReview] = useState(null)
  const allowNavigation = useRef(false)
  const savePending = useRef(false)
  const dirty = productHasChanges(initial, values)
  const blocker = useBlocker(() => (dirty || saving) && !allowNavigation.current)
  useEffect(() => {
    const warn = (event) => {
      if ((!dirty && !saving) || allowNavigation.current) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty, saving])
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
    <>
    <form
      className="product-editor"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const result = validateProduct(values, products, initial.id)
        setErrors(result.errors)
        if (Object.keys(result.errors).length) return
        setMessage('')
        setReview(result.product)
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
          <button
            type="button"
            className="button"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button className="button button-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save product'}
          </button>
        </div>
        {message && (
          <p role="alert" className="field-error">
            {message}
          </p>
        )}
      </section>
      <aside className="admin-panel product-proof">
        <p className="eyebrow">PRODUCT PREVIEW</p>
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
        <p>{games.find((game) => game.id === values.game)?.name} · {values.condition}</p>
        <p className="detail-price">{formatPrice(Number(values.price) || 0)}</p>
        <p>{values.stock === '' ? 'Stock not entered' : `${values.stock} in stock`}</p>
        <p>{values.isActive === false ? 'Archived · hidden from the store' : 'Active in store'}</p>
        <SavedReference product={initial} />
        <p className="prototype-note">
          Saved changes persist in store inventory. Artwork uses a URL or local
          asset path.
        </p>
      </aside>
    </form>
    <Dialog open={!!review} onClose={() => setReview(null)} labelledBy="product-save-heading" className="product-save-dialog" busy={saving} cancelLabel="Back to edit">
      <h2 id="product-save-heading">{initial.id && !dirty ? 'No changes detected.' : 'Review product'}</h2>
      <p>{initial.id && !dirty ? 'Are you sure you want to save this product again?' : 'Are you sure you want to save this product?'}</p>
      <div className="proof-art"><CardImage src={review?.imageUrl} name={review?.name || 'Product'} /></div>
      <h3>{review?.name}</h3>
      <p>{review?.setName}</p>
      <p className="detail-price">{formatPrice(Number(review?.price) || 0)}</p>
      <p>{review?.stock} in stock · {review?.isActive === false ? 'Archived' : 'Active in store'}</p>
      {message && <p className="field-error" role="alert">{message}</p>}
      <button type="button" className="button button-primary" disabled={saving} onClick={async () => {
        if (savePending.current) return
        savePending.current = true
        setSaving(true)
        setMessage('')
        try {
          await onSave(review)
          allowNavigation.current = true
          setReview(null)
          onSaved()
        } catch (error) {
          allowNavigation.current = false
          setErrors(apiFields(error))
          setMessage(apiError(error))
        } finally {
          savePending.current = false
          setSaving(false)
        }
      }}>{saving ? 'Saving...' : 'Confirm save'}</button>
    </Dialog>
    <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()} labelledBy="product-leave-heading" className="product-save-dialog" cancelLabel="Keep editing" focusCancel busy={saving}>
      <h2 id="product-leave-heading">Discard unsaved changes?</h2>
      <p>{saving ? 'Your product is being saved. Please wait for the result before leaving.' : 'Your product changes have not been saved. Are you sure you want to leave?'}</p>
      <button type="button" className="button button-primary" disabled={saving} onClick={() => blocker.proceed?.()}>Discard and leave</button>
    </Dialog>
    </>
  )
}
