import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { apiError, apiFields } from '../../utils/api'
import { safeReturnTo, loginDestination } from '../../utils/auth'
export default function AuthPage({ register = false }) {
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const { authenticate, user } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const returnTo = safeReturnTo(params.get('returnTo'))
  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setMessage('')
    try {
      const authenticated = await authenticate(
        register ? 'register' : 'login',
        register ? values : { email: values.email, password: values.password },
      )
      navigate(loginDestination(authenticated, returnTo), { replace: true })
    } catch (error) {
      setErrors(apiFields(error))
      setMessage(apiError(error))
    } finally {
      setSaving(false)
    }
  }
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return (
    <div className="page-width workshop-page auth-page">
      <header className="page-intro">
        <p className="eyebrow">TCG404 / YOUR COLLECTION</p>
        <h1>
          {register ? 'Make yourself at home.' : 'Welcome back, collector.'}
        </h1>
        <p>
          {register
            ? 'Create your customer account.'
            : 'Sign in to your account.'}
        </p>
      </header>
      <form className="editor-panel auth-form" onSubmit={submit}>
        {(register ? ['name', 'email', 'password'] : ['email', 'password']).map(
          (key) => (
            <label key={key}>
              {key === 'name' ? 'Name' : key === 'email' ? 'Email' : 'Password'}
              <input
                name={key}
                type={
                  key === 'password'
                    ? 'password'
                    : key === 'email'
                      ? 'email'
                      : 'text'
                }
                autoComplete={
                  key === 'password'
                    ? register
                      ? 'new-password'
                      : 'current-password'
                    : key
                }
                required
                minLength={key === 'password' && register ? 8 : undefined}
                value={values[key]}
                onChange={(e) =>
                  setValues((current) => ({
                    ...current,
                    [key]: e.target.value,
                  }))
                }
                aria-invalid={!!errors[key]}
                aria-describedby={errors[key] ? `auth-${key}` : undefined}
              />
              {errors[key] && (
                <span id={`auth-${key}`} className="field-error">
                  {errors[key]}
                </span>
              )}
            </label>
          ),
        )}
        {message && (
          <p role="alert" className="field-error">
            {message}
          </p>
        )}
        <button className="button button-primary" disabled={saving}>
          {saving ? 'Please wait...' : register ? 'Create account' : 'Sign in'}
        </button>
        <p>
          <Link
            to={`${register ? '/login' : '/register'}?returnTo=${encodeURIComponent(returnTo)}`}
          >
            {register
              ? 'Already a collector? Sign in'
              : 'Create a customer account'}
          </Link>
        </p>
      </form>
    </div>
  )
}
