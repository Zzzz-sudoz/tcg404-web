import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import ChangePassword from '../../components/store/ChangePassword'
import { useAuth } from '../../hooks/useAuth'
import { apiError, apiFields } from '../../utils/api'

export default function AccountPage() {
  const { user, loadProfile, saveProfile } = useAuth()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [revision, setRevision] = useState(0)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const pending = useRef(false)
  const errorSummary = useRef(null)
  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setLoadError('')
      try {
        const profile = await loadProfile(controller.signal)
        if (!controller.signal.aborted) setName(profile.name)
      } catch (e) {
        if (e.code !== 'ERR_CANCELED') setLoadError(apiError(e))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 0)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [loadProfile, revision])
  const submit = async (event) => {
    event.preventDefault()
    if (pending.current) return
    setMessage('')
    if (!name.trim() || name.trim().length > 100) {
      setError('Enter a name of 1 to 100 characters.')
      errorSummary.current?.focus()
      return
    }
    pending.current = true
    setSaving(true)
    setError('')
    try {
      const updated = await saveProfile(name.trim())
      setName(updated.name)
      setMessage('Profile saved.')
    } catch (e) {
      setError(apiFields(e).name || apiError(e))
      errorSummary.current?.focus()
    } finally {
      pending.current = false
      setSaving(false)
    }
  }
  return (
    <div className="page-width workshop-page auth-page">
      <header className="page-intro">
        <p className="eyebrow">TCG404 / YOUR ACCOUNT</p>
        <h1>Your account.</h1>
      </header>
      {loading ? (
        <div className="empty-panel" role="status">
          Loading your profile...
        </div>
      ) : loadError ? (
        <div className="empty-panel" role="alert">
          <p>{loadError}</p>
          <button
            className="button"
            onClick={() => setRevision((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="account-panels">
          <form className="editor-panel auth-form" onSubmit={submit} noValidate>
            <h2>Profile</h2>
            <label htmlFor="profile-name">
              Name
              <input
                id="profile-name"
                name="name"
                autoComplete="name"
                value={name}
                maxLength={100}
                required
                disabled={saving}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? 'profile-error' : undefined}
              />
            </label>
            <label htmlFor="profile-email">
              Email
              <input
                id="profile-email"
                type="email"
                value={user.email}
                readOnly
              />
            </label>
            <p>
              Account role:{' '}
              <strong>{user.role === 'admin' ? 'Admin' : 'Customer'}</strong>
            </p>
            <p
              id="profile-error"
              ref={errorSummary}
              tabIndex={-1}
              role={error ? 'alert' : undefined}
              className="field-error"
            >
              {error}
            </p>
            {message && <p role="status">{message}</p>}
            <button className="button button-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save profile'}
            </button>
            <Link to="/cart">View your cart</Link>
            <Link to="/account/orders">View your orders</Link>
            {user.role === 'admin' && (
              <Link to="/admin">Open admin workspace</Link>
            )}
          </form>
          <ChangePassword />
        </div>
      )}
    </div>
  )
}
