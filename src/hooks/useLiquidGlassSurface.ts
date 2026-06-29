import { useEffect, useRef, type RefObject } from 'react'

type LiquidGlassSurfaceOptions = {
  borderRadius: number
  type: 'rounded' | 'circle' | 'pill'
}

export default function useLiquidGlassSurface<T extends HTMLElement>(
  options: LiquidGlassSurfaceOptions
): RefObject<T | null> {
  const elementRef = useRef<T>(null)
  const { borderRadius, type } = options

  useEffect(() => {
    const element = elementRef.current

    if (!element) {
      return
    }

    element.classList.add('liquid-glass-surface')
    element.style.setProperty('--glass-border-radius', `${borderRadius}px`)
    element.dataset.glassType = type

    return () => {
      element.classList.remove('liquid-glass-surface')
      element.style.removeProperty('--glass-border-radius')
      delete element.dataset.glassType
    }
  }, [borderRadius, type])

  return elementRef
}
