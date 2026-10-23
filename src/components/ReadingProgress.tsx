import { useEffect, type RefObject } from 'react'
import { readingStatus } from '../lib/readingTime'

export default function useReadingProgress(
  barRef: RefObject<HTMLDivElement | null>,
  statusRef: RefObject<HTMLParagraphElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  minutes: number,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return

    let frame = 0
    const apply = () => {
      frame = 0
      const content = contentRef.current
      let progress = 0
      if (content) {
        const bounds = content.getBoundingClientRect()
        const start = window.scrollY + bounds.top
        const end = start + bounds.height
        const viewportBottom = window.scrollY + window.innerHeight
        const range = end - start - window.innerHeight
        if (viewportBottom >= end - 1) progress = 1
        else if (range > 0) progress = Math.min(1, Math.max(0, (window.scrollY - start) / range))
      }
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
  }, [active, barRef, contentRef, minutes, statusRef])
}
