import { useRef, useState } from 'react'
import { api, apiError } from '../../utils/api'
import { passwordChecks } from '../../utils/password'
import PasswordChecks from '../common/PasswordChecks'

export default function ChangePassword() {
  const [values, setValues] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const pending = useRef(false)
  const summary = useRef(null)
  const matches = values.newPassword === values.confirmPassword
  async function submit(event) {
    event.preventDefault()
    if (pending.current) return
    setMessage('')
    if (
      !values.oldPassword ||
      passwordChecks(values.newPassword).some((check) => !check.valid) ||
      !matches
    ) {
      setError('Check the password requirements and confirmation.')
      summary.current?.focus()
      return
    }
    pending.current = true
    setBusy(true)
    setError('')
    try {
      await api.patch('/auth/password', values)
      setValues({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setMessage('Password updated.')
    } catch (issue) {
      setError(apiError(issue))
      summary.current?.focus()
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return (
    <form className="editor-panel auth-form password-form" onSubmit={submit}>
      <h2>Change password</h2>
      {Object.entries({
        oldPassword: 'Current password',
        newPassword: 'New password',
        confirmPassword: 'Confirm new password',
      }).map(([key, label]) => (
        <label key={key}>
          {label}
          <input
            type="password"
            name={key}
            autoComplete={
              key === 'oldPassword' ? 'current-password' : 'new-password'
            }
            required
            maxLength={128}
            value={values[key]}
            disabled={busy}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                [key]: event.target.value,
              }))
            }
            aria-invalid={
              key === 'confirmPassword' && !!values[key] && !matches
            }
          />
          {key === 'newPassword' && (
            <PasswordChecks value={values.newPassword} />
          )}
          {key === 'confirmPassword' && values[key] && (
            <span className={matches ? 'field-success' : 'field-error'}>
              {matches ? 'Passwords match.' : 'Passwords must match.'}
            </span>
          )}
        </label>
      ))}
      <p
        ref={summary}
        tabIndex={-1}
        role={error ? 'alert' : undefined}
        className="field-error"
      >
        {error}
      </p>
      {message && (
        <p role="status" className="field-success">
          {message}
        </p>
      )}
      <button className="button button-primary" disabled={busy}>
        {busy ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
