import { useEffect, useRef, type RefObject } from 'react'
import { useLocation } from 'react-router-dom'
import { Container, type ContainerOptions } from '../vendor/liquid-glass-js/container.js'

type LiquidGlassSurfaceOptions = Omit<ContainerOptions, 'element' | 'tintOpacity'>

const GLASS_CONTROLS = {
  edgeIntensity: 0.01,
  rimIntensity: 0.05,
  baseIntensity: 0.01,
  edgeDistance: 0.15,
  rimDistance: 0.8,
  baseDistance: 0.1,
  cornerBoost: 0.02,
  rippleEffect: 0.1,
  blurRadius: 5.0,
  tintOpacity: 0.2,
}

declare global {
  interface Window {
    glassControls?: typeof GLASS_CONTROLS
  }
}

let activeSnapshotKey: string | null = null

function supportsWebGL() {
  const canvas = document.createElement('canvas')
  return Boolean(
    canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')
  )
}

export default function useLiquidGlassSurface<T extends HTMLElement>(
  options: LiquidGlassSurfaceOptions
): RefObject<T | null> {
  const elementRef = useRef<T>(null)
  const location = useLocation()
  const snapshotKey = location.pathname
  const { borderRadius, type } = options

  useEffect(() => {
    const element = elementRef.current

    if (!element || !supportsWebGL()) {
      return
    }

    const targetElement = element
    let container: Container | null = null
    let resizeObserver: ResizeObserver | null = null

    function activateGlass() {
      if (container) return

      if (activeSnapshotKey !== snapshotKey) {
        Container.resetPageSnapshot()
        activeSnapshotKey = snapshotKey
      }

      targetElement.classList.add('liquid-glass-surface')
      window.glassControls = GLASS_CONTROLS
      container = new Container({
        borderRadius,
        element: targetElement,
        tintOpacity: GLASS_CONTROLS.tintOpacity,
        type,
      })

      resizeObserver = new ResizeObserver(() => {
        container?.updateSizeFromDOM()
        container?.render?.()
      })

      resizeObserver.observe(targetElement)
    }

    function deactivateGlass() {
      resizeObserver?.disconnect()
      resizeObserver = null
      container?.destroy()
      container = null
      targetElement.classList.remove('liquid-glass-surface')
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          activateGlass()
        } else {
          deactivateGlass()
        }
      },
      {
        rootMargin: '120px 0px',
        threshold: 0,
      }
    )

    observer.observe(targetElement)

    return () => {
      observer.disconnect()
      deactivateGlass()
    }
  }, [borderRadius, type, snapshotKey])

  return elementRef
}
