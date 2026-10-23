import { useEffect, type RefObject } from 'react'
import { readingStatus } from '../lib/readingTime'

export default function useReadingProgress(
  barRef: RefObject<HTMLDivElement | null>,
  statusRef: RefObject<HTMLParagraphElement | null>,
  minutes: number,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return

    let frame = 0
    const apply = () => {
      frame = 0
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollable <= 0
        ? 0
        : Math.min(1, Math.max(0, window.scrollY / scrollable))
      const bar = barRef.current
      const status = statusRef.current
      if (bar) bar.style.transform = `scaleX(${progress})`
      if (status) status.textContent = readingStatus(minutes, progress)
    }
    const request = () => {
      if (frame) return
      frame = window.requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', request)
    }
  }, [active, barRef, minutes, statusRef])
}
