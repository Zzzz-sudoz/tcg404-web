import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { apiError, apiFields } from '../../utils/api'
import { safeReturnTo, loginDestination } from '../../utils/auth'
import { validateRegistration } from '../../utils/password'
import PasswordChecks from '../../components/common/PasswordChecks'

export default function AuthPage({ register = false }) {
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  const summary = useRef(null)
  const { authenticate, user } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const returnTo = safeReturnTo(params.get('returnTo'))
  const submit = async (event) => {
    event.preventDefault()
    if (pending.current) return
    const issues = register ? validateRegistration(values) : {}
    setErrors(issues)
    setMessage('')
    if (Object.keys(issues).length) {
      setMessage('Check the highlighted fields.')
      summary.current?.focus()
      return
    }
    pending.current = true
    setSaving(true)
    try {
      const authenticated = await authenticate(
        register ? 'register' : 'login',
        {
          ...(register ? { name: values.name.trim() } : {}),
          email: values.email.trim(),
          password: values.password,
        },
      )
      navigate(loginDestination(authenticated, returnTo), { replace: true })
    } catch (error) {
      setErrors(apiFields(error))
      setMessage(apiError(error))
      summary.current?.focus()
    } finally {
      pending.current = false
      setSaving(false)
    }
  }
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  const fields = register
    ? ['name', 'email', 'password', 'confirmPassword']
    : ['email', 'password']
  const matches = values.password === values.confirmPassword
  return (
    <div className="page-width workshop-page auth-page">
      <header className="page-intro">
        <p className="eyebrow">TCG404</p>
        <h1>{register ? 'Create account.' : 'Welcome back.'}</h1>
      </header>
      <form className="editor-panel auth-form" onSubmit={submit}>
        {fields.map((key) => (
          <label key={key}>
            {key === 'name'
              ? 'Name'
              : key === 'email'
                ? register
                  ? 'Email'
                  : 'Email or username'
                : key === 'confirmPassword'
                  ? 'Confirm password'
                  : 'Password'}
            <input
              name={key}
              type={
                key.toLowerCase().includes('password')
                  ? 'password'
                  : key === 'email' && register
                    ? 'email'
                    : 'text'
              }
              autoComplete={
                key.toLowerCase().includes('password')
                  ? register
                    ? 'new-password'
                    : 'current-password'
                  : key === 'email' && !register
                    ? 'username'
                    : key
              }
              required
              maxLength={key === 'name' ? 100 : key === 'email' ? 254 : 128}
              value={values[key]}
              disabled={saving}
              onChange={(event) => {
                setValues((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
                setErrors((current) => ({ ...current, [key]: '' }))
              }}
              aria-invalid={
                !!errors[key] ||
                (key === 'confirmPassword' && !!values[key] && !matches)
              }
              aria-describedby={errors[key] ? 'auth-' + key : undefined}
            />
            {key === 'password' && register && (
              <PasswordChecks value={values.password} />
            )}
            {key === 'confirmPassword' && values[key] && !errors[key] && (
              <span className={matches ? 'field-success' : 'field-error'}>
                {matches ? 'Passwords match.' : 'Passwords must match.'}
              </span>
            )}
            {errors[key] && (
              <span id={'auth-' + key} className="field-error">
                {errors[key]}
              </span>
            )}
          </label>
        ))}
        <p
          ref={summary}
          tabIndex={-1}
          role={message ? 'alert' : undefined}
          className="field-error"
        >
          {message}
        </p>
        <button className="button button-primary" disabled={saving}>
          {saving ? 'Please wait...' : register ? 'Create account' : 'Login'}
        </button>
        <p className="auth-switch">
          <span>{register ? 'Already have an account?' : "Don't have an account?"}</span>
          <Link
            to={
              (register ? '/login' : '/register') +
              '?returnTo=' +
              encodeURIComponent(returnTo)
            }
          >
            {register ? 'Login' : 'Sign up'}
          </Link>
        </p>
      </form>
    </div>
  )
}
