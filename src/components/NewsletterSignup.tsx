import { useId, useState, type FormEvent } from 'react'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'

type NewsletterSurface = 'panel' | 'inline'
type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error'

interface NewsletterSignupProps {
  surface?: NewsletterSurface
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function NewsletterSignup({
  surface = 'panel',
}: NewsletterSignupProps) {
  const emailId = useId()
  const messageId = useId()
  const honeypotId = useId()
  const panelRef = useLiquidGlassSurface<HTMLElement>({
    borderRadius: surface === 'panel' ? 30 : 22,
    type: 'rounded',
  })
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<SubmitStatus>('idle')
  const [message, setMessage] = useState('No spam. Just new posts when they ship.')
  const isSubmitting = status === 'submitting'
  const isPanel = surface === 'panel'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const website = String(formData.get('website') ?? '').trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (!emailPattern.test(normalizedEmail)) {
      setStatus('error')
      setMessage('Enter a valid email address.')
      return
    }

    setStatus('submitting')
    setMessage('Joining the list...')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          website,
        }),
      })
      const result = await response.json().catch(() => null)
      const responseMessage =
        typeof result?.message === 'string'
          ? result.message
          : response.ok
            ? "You're on the list."
            : 'Newsletter signup failed. Try again in a bit.'

      if (!response.ok) {
        throw new Error(responseMessage)
      }

      setEmail('')
      setStatus('success')
      setMessage(responseMessage)
    } catch (error) {
      setStatus('error')
      setMessage(
        error instanceof Error
          ? error.message
          : 'Newsletter signup failed. Try again in a bit.'
      )
    }
  }

  return (
    <section
      className={`newsletter-signup newsletter-signup--${surface}${isPanel ? ' glass-panel' : ''}`}
      ref={isPanel ? panelRef : undefined}
      aria-labelledby={`${emailId}-heading`}
    >
      <div className="newsletter-signup__content">
        <p className="eyebrow">Email list</p>
        <h2 id={`${emailId}-heading`}>Get new field notes</h2>
        <p className="hero-copy">
          Receive an email when a new post is published.
        </p>
      </div>
      <form className="newsletter-signup__form" onSubmit={handleSubmit}>
        <div className="newsletter-signup__field">
          <label htmlFor={emailId}>Email address</label>
          <div className="newsletter-signup__controls">
            <input
              id={emailId}
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              aria-describedby={messageId}
              disabled={isSubmitting}
              required
            />
            <button className="action action--primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Joining...' : 'Notify me'}
            </button>
          </div>
        </div>
        <label className="newsletter-signup__trap" htmlFor={honeypotId}>
          Website
        </label>
        <input
          className="newsletter-signup__trap"
          id={honeypotId}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
        <p
          id={messageId}
          className={`newsletter-signup__message newsletter-signup__message--${status}`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      </form>
    </section>
  )
}
