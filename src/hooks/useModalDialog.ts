import { useEffect, useRef } from 'react'

/**
 * Canonical lifecycle for a modal <dialog>: opens on mount, locks body
 * scroll, closes on backdrop click, Escape, or native cancel, and cleans
 * up on unmount.
 */
export default function useModalDialog(onClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function closeFromBackdrop(event: globalThis.MouseEvent) {
      if (event.target === dialog) {
        onClose()
      }
    }

    function closeFromEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    function closeFromCancel(event: Event) {
      event.preventDefault()
      onClose()
    }

    dialog.addEventListener('click', closeFromBackdrop)
    dialog.addEventListener('keydown', closeFromEscape)
    dialog.addEventListener('cancel', closeFromCancel)

    if (!dialog.open) {
      dialog.showModal()
    }

    return () => {
      document.body.style.overflow = previousOverflow
      dialog.removeEventListener('click', closeFromBackdrop)
      dialog.removeEventListener('keydown', closeFromEscape)
      dialog.removeEventListener('cancel', closeFromCancel)

      if (dialog.open) {
        dialog.close()
      }
    }
  }, [onClose])

  return dialogRef
}
