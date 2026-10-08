import { useEffect, useRef } from 'react'
export default function Dialog({
  open,
  onClose,
  labelledBy,
  children,
  className,
  cancelLabel = 'Cancel',
  busy = false,
  focusCancel = false,
}) {
  const ref = useRef(null)
  const cancel = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (!open) return
    const previous = document.activeElement
    dialog.showModal()
    if (focusCancel) cancel.current?.focus()
    return () => {
      if (dialog.open) dialog.close()
      previous?.focus()
    }
  }, [open, focusCancel])
  useEffect(() => {
    if (open && busy) ref.current?.focus()
  }, [open, busy])
  return (
    <dialog
      ref={ref}
      className={className}
      aria-labelledby={labelledBy}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (busy && event.key === 'Escape') event.preventDefault()
      }}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(event) => {
        if (!busy && event.target === ref.current) onClose()
      }}
    >
      {children}
      <button
        ref={cancel}
        className="button dialog-cancel"
        onClick={onClose}
        disabled={busy}
      >
        {cancelLabel}
      </button>
    </dialog>
  )
}
