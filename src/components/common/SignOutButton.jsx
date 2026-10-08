import { useRef, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { apiError } from '../../utils/api'
import Dialog from './Dialog'
import Icon from './Icon'

export default function SignOutButton({ onSignedOut }) {
  const { logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)
  async function confirm() {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      await logout()
      setOpen(false)
      onSignedOut?.()
    } catch (issue) {
      setError(apiError(issue))
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return (
    <>
      <button
        className="signout-trigger"
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setError('')
          setOpen(true)
        }}
      >
        <Icon name="logout" />
        Logout
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="signout-title"
        className="signout-dialog"
        busy={busy}
        focusCancel
      >
        <div className="signout-emblem" aria-hidden="true">
          <Icon name="logout" />
        </div>
        <h2 id="signout-title">Are you sure you want to logout?</h2>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button button-danger signout-confirm"
          disabled={busy}
          onClick={confirm}
        >
          {busy ? 'Logging out…' : 'Logout'}
        </button>
      </Dialog>
    </>
  )
}
