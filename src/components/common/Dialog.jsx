import { useEffect, useRef } from 'react'
export default function Dialog({ open, onClose, labelledBy, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const dialog = ref.current
    if (!open) return
    const previous = document.activeElement
    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
      previous?.focus()
    }
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      {children}
      <button className="button" onClick={onClose}>
        Cancel
      </button>
    </dialog>
  )
}
