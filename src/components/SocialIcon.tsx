type SocialIconName = 'github' | 'linkedin' | 'microsoft'

interface SocialIconProps {
  name: SocialIconName
}

export default function SocialIcon({ name }: SocialIconProps) {
  if (name === 'github') {
    return (
      <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2C6.48 2 2 6.58 2 12.22c0 4.52 2.87 8.35 6.84 9.71.5.09.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.51.47-3.16-.63-3.36-1.21-.11-.3-.6-1.21-1.03-1.45-.35-.19-.85-.66-.01-.67.79-.01 1.35.74 1.54 1.05.9 1.54 2.34 1.1 2.91.84.09-.66.35-1.1.64-1.36-2.22-.26-4.55-1.14-4.55-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.32 9.32 0 0 1 12 6.95c.85 0 1.71.12 2.51.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.92-2.34 4.79-4.57 5.05.36.32.68.93.68 1.89 0 1.36-.01 2.46-.01 2.79 0 .27.18.59.69.49A10.1 10.1 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z"
        />
      </svg>
    )
  }

  if (name === 'linkedin') {
    return (
      <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6.94 8.98H3.75v10.27h3.19V8.98ZM5.34 4a1.85 1.85 0 1 0 0 3.7 1.85 1.85 0 0 0 0-3.7Zm13.91 9.36c0-3.1-1.66-4.54-3.87-4.54a3.34 3.34 0 0 0-3.01 1.65h-.04V8.98H9.27v10.27h3.19v-5.08c0-1.34.25-2.64 1.91-2.64 1.64 0 1.66 1.54 1.66 2.73v4.99h3.19l.03-5.89Z"
        />
      </svg>
    )
  }

  if (name === 'microsoft') {
    return (
      <svg className="social-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect fill="currentColor" x="3" y="3" width="8" height="8" />
        <rect fill="currentColor" x="13" y="3" width="8" height="8" />
        <rect fill="currentColor" x="3" y="13" width="8" height="8" />
        <rect fill="currentColor" x="13" y="13" width="8" height="8" />
      </svg>
    )
  }

  return null
}
