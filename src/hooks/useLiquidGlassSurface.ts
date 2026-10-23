import { useCallback, useRef, type Ref } from 'react'

type LiquidGlassSurfaceOptions = {
  borderRadius: number
  type: 'rounded' | 'circle' | 'pill'
}

function clearGlass(element: HTMLElement) {
  element.classList.remove('liquid-glass-surface')
  element.style.removeProperty('--glass-border-radius')
  delete element.dataset.glassType
}

export default function useLiquidGlassSurface<T extends HTMLElement>(
  options: LiquidGlassSurfaceOptions,
): Ref<T> {
  const nodeRef = useRef<T | null>(null)
  const { borderRadius, type } = options

  return useCallback((node: T | null) => {
    const previous = nodeRef.current
    if (previous && previous !== node) clearGlass(previous)
    nodeRef.current = node
    if (!node) return
    node.classList.add('liquid-glass-surface')
    node.style.setProperty('--glass-border-radius', `${borderRadius}px`)
    node.dataset.glassType = type
  }, [borderRadius, type])
}
