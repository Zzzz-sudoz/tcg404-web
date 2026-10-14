import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import { apiError, apiFields } from '../../utils/api'
import { safeReturnTo, loginDestination } from '../../utils/auth'
import { validateRegistration } from '../../utils/password'
import PasswordChecks from '../../components/common/PasswordChecks'
import TextField from '@mui/material/TextField'
import { createTheme, ThemeProvider } from '@mui/material/styles'

const authTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#f4da81' },
    error: { main: '#f5a698' },
    success: { main: '#9ee0c7' },
    text: { primary: '#f6f3ea', secondary: '#b7b6c3' },
  },
  typography: { fontFamily: "'Segoe UI', Arial, sans-serif" },
  shape: { borderRadius: 12 },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        input: { '&:focus-visible': { outline: 'none' } },
        notchedOutline: { borderColor: '#777887' },
      },
    },
  },
})

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
        <h1>{register ? 'Create account.' : 'Welcome back.'}</h1>
      </header>
      <ThemeProvider theme={authTheme}>
      <form className="editor-panel auth-form" onSubmit={submit}>
        {fields.map((key) => (
          <div key={key}>
            <TextField
              id={'auth-' + key}
              fullWidth
              variant="outlined"
              label={key === 'name'
              ? 'Name'
              : key === 'email'
                ? register
                  ? 'Email'
                  : 'Email or username'
                : key === 'confirmPassword'
                  ? 'Confirm password'
                  : 'Password'}
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
              slotProps={{ htmlInput: { maxLength: key === 'name' ? 100 : key === 'email' ? 254 : 128 } }}
              value={values[key]}
              disabled={saving}
              onChange={(event) => {
                setValues((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
                setErrors((current) => ({ ...current, [key]: '' }))
              }}
              error={
                !!errors[key] ||
                (key === 'confirmPassword' && !!values[key] && !matches)
              }
              helperText={errors[key] || (key === 'confirmPassword' && values[key]
                ? matches ? 'Passwords match.' : 'Passwords must match.'
                : undefined)}
              sx={key === 'confirmPassword' && values[key] && matches && !errors[key]
                ? { '& .MuiFormHelperText-root': { color: 'success.main' } }
                : undefined}
            />
            {key === 'password' && register && (
              <PasswordChecks value={values.password} />
            )}
          </div>
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
      </ThemeProvider>
    </div>
  )
}
