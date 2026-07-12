import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import NewsletterSignup from './NewsletterSignup'
import useModalDialog from '../hooks/useModalDialog'

const SUBSCRIBED_KEY = 'newsletter-popup-subscribed'
const DISMISSED_AT_KEY = 'newsletter-popup-dismissed-at'
const DISMISS_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000
const OPEN_DELAY_MS = 12_000
const SUCCESS_CLOSE_DELAY_MS = 1800

function shouldOffer(): boolean {
  try {
    if (window.localStorage.getItem(SUBSCRIBED_KEY)) {
      return false
    }

    const dismissedAt = Number(
      window.localStorage.getItem(DISMISSED_AT_KEY) ?? 0
    )

    return Date.now() - dismissedAt > DISMISS_SNOOZE_MS
  } catch {
    return false
  }
}

function remember(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Storage unavailable; skip persistence.
  }
}

interface NewsletterPopupDialogProps {
  onClose: () => void
  onSuccess: () => void
}

function NewsletterPopupDialog({
  onClose,
  onSuccess,
}: NewsletterPopupDialogProps) {
  const dialogRef = useModalDialog(onClose)

  return (
    <dialog
      ref={dialogRef}
      className="glass-dialog newsletter-popup"
      aria-label="Newsletter signup"
    >
      <div className="newsletter-popup__panel">
        <button
          className="glass-dialog__close newsletter-popup__close"
          type="button"
          onClick={onClose}
          aria-label="Close newsletter signup"
        >
          x
        </button>
        <NewsletterSignup surface="popup" onSuccess={onSuccess} />
      </div>
    </dialog>
  )
}

export default function NewsletterPopup() {
  const { pathname } = useLocation()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!shouldOffer()) {
      return
    }

    const timer = window.setTimeout(() => setIsOpen(true), OPEN_DELAY_MS)

    return () => window.clearTimeout(timer)
  }, [])

  const dismiss = useCallback(() => {
    remember(DISMISSED_AT_KEY, String(Date.now()))
    setIsOpen(false)
  }, [])

  const handleSuccess = useCallback(() => {
    remember(SUBSCRIBED_KEY, '1')
    window.setTimeout(() => setIsOpen(false), SUCCESS_CLOSE_DELAY_MS)
  }, [])

  // Never interrupt the social-card screenshot surface.
  if (pathname === '/social-card' || !isOpen) {
    return null
  }

  return <NewsletterPopupDialog onClose={dismiss} onSuccess={handleSuccess} />
}
