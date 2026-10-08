import { useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useApiQuery } from '../../hooks/useApiQuery'
import { api, apiError } from '../../utils/api'
import { validateCheckout, paymentMethodLabel } from '../../utils/checkout'
import Icon from '../../components/common/Icon'

export default function AccountPreferences({ payments = false }) {
  const { user } = useAuth()
  const group = payments ? 'payments' : 'addresses'
  const [revision, setRevision] = useState(0)
  const response = useApiQuery('/auth/preferences', '', revision)
  const [draft, setDraft] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const pending = useRef(false)
  const rows = response.data.preferences?.[group] || []
  const blank = () =>
    payments
      ? {
          id: crypto.randomUUID(),
          method: 'gcash',
          label: '',
          mobile: '',
          holder: user.name,
          expiry: '',
          brand: 'visa',
          last4: '',
        }
      : {
          id: crypto.randomUUID(),
          label: '',
          name: user.name,
          email: user.email,
          phone: '',
          address: '',
          city: '',
          province: '',
          postalCode: '',
          country: 'Philippines',
        }
  async function save(next) {
    if (pending.current) return false
    pending.current = true
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const latest = await api.get('/auth/preferences')
      await api.patch('/auth/preferences', {
        ...latest.data.data.preferences,
        [group]: next,
      })
      setRevision((value) => value + 1)
      setMessage('Saved.')
      return true
    } catch (issue) {
      setError(apiError(issue))
      return false
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  async function submit(event) {
    event.preventDefault()
    let value
    if (payments) {
      const keys =
        draft.method === 'gcash'
          ? ['id', 'label', 'method', 'mobile']
          : ['id', 'label', 'method', 'holder', 'brand', 'last4', 'expiry']
      value = Object.fromEntries(keys.map((key) => [key, draft[key].trim()]))
    } else {
      const issues = validateCheckout(draft)
      if (Object.keys(issues).length) {
        setError(Object.values(issues)[0])
        return
      }
      value = Object.fromEntries(
        Object.entries(draft).map(([key, text]) => [key, text.trim()]),
      )
    }
    const next = rows.some((row) => row.id === value.id)
      ? rows.map((row) => (row.id === value.id ? value : row))
      : [...rows, value]
    if (await save(next)) setDraft(null)
  }
  const field = (key, label, maxLength, pattern, type = 'text') => (
    <label key={key}>
      {label}
      <input
        name={key}
        type={type}
        required
        maxLength={maxLength}
        pattern={pattern}
        value={draft[key]}
        disabled={busy}
        onChange={(event) =>
          setDraft((current) => ({ ...current, [key]: event.target.value }))
        }
        autoComplete={key === 'last4' ? 'off' : undefined}
      />
    </label>
  )
  return (
    <section className="customer-preferences">
      <header className="page-intro">
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h1>{payments ? 'Payment methods.' : 'Delivery addresses.'}</h1>
      </header>
      {response.loading ? (
        <p role="status">Loading saved details...</p>
      ) : response.error ? (
        <div role="alert">
          <p>{response.error}</p>
          <button
            className="button"
            onClick={() => setRevision((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
          {message && <p role="status">{message}</p>}
          <div className="saved-preferences">
            {rows.map((row, index) => (
              <article className="saved-preference" key={row.id}>
                <div className="row-between">
                  <Icon name={payments ? 'payment' : 'location'} />
                  {index === 0 && (
                    <span className="saved-default">Default</span>
                  )}
                </div>
                <h2>{row.label}</h2>
                {payments ? (
                  <>
                    <strong>
                      {paymentMethodLabel({
                        ...row,
                        last4:
                          row.method === 'gcash'
                            ? row.mobile.slice(-4)
                            : row.last4,
                        brand: row.method === 'gcash' ? 'gcash' : row.brand,
                      })}
                    </strong>
                    <p>
                      {row.method === 'card'
                        ? `${row.holder} · ${row.expiry}`
                        : row.mobile}
                    </p>
                  </>
                ) : (
                  <>
                    <strong>{row.name}</strong>
                    <p>
                      {row.address}
                      <br />
                      {row.city}, {row.province} {row.postalCode}
                    </p>
                    <p>{row.phone}</p>
                  </>
                )}
                <div className="form-actions">
                  <button
                    type="button"
                    className="text-link"
                    disabled={busy}
                    onClick={() => {
                      setDraft({ ...blank(), ...row })
                      setError('')
                    }}
                  >
                    Edit
                  </button>
                  {index > 0 && (
                    <button
                      type="button"
                      className="text-link"
                      disabled={busy}
                      onClick={() =>
                        save([
                          row,
                          ...rows.filter((item) => item.id !== row.id),
                        ])
                      }
                    >
                      Make default
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-link preference-remove"
                    disabled={busy}
                    onClick={() =>
                      save(rows.filter((item) => item.id !== row.id))
                    }
                  >
                    <Icon name="trash" />
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
          {!rows.length && !draft && (
            <div className="customer-empty">
              <Icon name={payments ? 'payment' : 'location'} />
              <h2>
                {payments ? 'Your payment methods.' : 'Your delivery details.'}
              </h2>
            </div>
          )}
          {!draft && (
            <button
              className="button button-primary"
              disabled={busy || rows.length >= 5}
              onClick={() => {
                setDraft(blank())
                setMessage('')
                setError('')
              }}
            >
              Add {payments ? 'payment method' : 'address'}{' '}
              <Icon name="arrow" />
            </button>
          )}
          {rows.length >= 5 && !draft && (
            <p className="muted">
              Five saved entries. Edit or remove one to add another.
            </p>
          )}
          {draft && (
            <form className="editor-panel preference-form" onSubmit={submit}>
              <h2>
                {rows.some((row) => row.id === draft.id) ? 'Edit' : 'Add'}{' '}
                {payments ? 'payment method' : 'address'}
              </h2>
              {field('label', 'Label', 40)}
              {payments ? (
                <>
                  <label>
                    Method
                    <select
                      disabled={busy}
                      value={draft.method}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          method: event.target.value,
                        }))
                      }
                    >
                      <option value="gcash">GCash</option>
                      <option value="card">Credit / debit card</option>
                    </select>
                  </label>
                  {draft.method === 'gcash' ? (
                    field(
                      'mobile',
                      'GCash mobile number',
                      13,
                      '(09[0-9]{9}|\\+639[0-9]{9})',
                      'tel',
                    )
                  ) : (
                    <>
                      <label>
                        Card brand
                        <select
                          disabled={busy}
                          value={draft.brand}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              brand: event.target.value,
                            }))
                          }
                        >
                          <option value="visa">Visa</option>
                          <option value="mastercard">Mastercard</option>
                          <option value="card">Other card</option>
                        </select>
                      </label>
                      {field('holder', 'Name on card', 100)}
                      <div className="form-pair">
                        {field('last4', 'Last four digits', 4, '[0-9]{4}')}
                        {field(
                          'expiry',
                          'Expiry (MM/YY)',
                          5,
                          '(0[1-9]|1[0-2])/[0-9]{2}',
                        )}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="form-pair">
                    {field('name', 'Recipient name', 100)}
                    {field('email', 'Email', 254, undefined, 'email')}
                  </div>
                  {field('phone', 'Phone', 30, undefined, 'tel')}
                  {field('address', 'Street address', 500)}
                  <div className="form-pair">
                    {field('city', 'City / municipality', 100)}
                    {field('province', 'Province', 100)}
                  </div>
                  {field('postalCode', 'Postal code', 4, '[0-9]{4}')}
                  <label>
                    Country
                    <input value="Philippines" readOnly />
                  </label>
                </>
              )}
              <div className="form-actions">
                <button className="button button-primary" disabled={busy}>
                  {busy ? 'Saving...' : 'Save details'}
                </button>
                <button
                  className="button"
                  type="button"
                  disabled={busy}
                  onClick={() => setDraft(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  )
}
