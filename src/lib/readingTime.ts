import { readingMinutesBySlug } from '../generated/readingMinutes'

export function readingMinutes(slug: string) {
  const minutes = readingMinutesBySlug[slug]
  return typeof minutes === 'number' && minutes > 0 ? minutes : 0
}

export function readingStatus(minutes: number, progress: number) {
  const clamped = Math.min(1, Math.max(0, progress))
  if (clamped >= 0.985) return 'Complete'
  if (minutes <= 0) return `${Math.round(clamped * 100)}% read`
  if (clamped < 0.04) return `${minutes} min read`
  const remaining = Math.max(1, Math.ceil(minutes * (1 - clamped)))
  return remaining === 1 ? '1 min left' : `${remaining} min left`
}
