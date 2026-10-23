interface IconProps {
  className?: string
}

function StrokeIcon({ className = 'icon', children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export function IconCopy({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V6.5A1.5 1.5 0 0 1 6.5 5H15" />
    </StrokeIcon>
  )
}

export function IconCheck({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M5 12.5 9.2 17 19 7" />
    </StrokeIcon>
  )
}

export function IconClose({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M7 7l10 10M17 7 7 17" />
    </StrokeIcon>
  )
}

export function IconArrow({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </StrokeIcon>
  )
}

export function IconUp({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </StrokeIcon>
  )
}

export function IconLink({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.2 1.2" />
      <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.2-1.2" />
    </StrokeIcon>
  )
}

export function IconChevron({ className }: IconProps) {
  return (
    <StrokeIcon className={className}>
      <path d="M6 9l6 6 6-6" />
    </StrokeIcon>
  )
}
