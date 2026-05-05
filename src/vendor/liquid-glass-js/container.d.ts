export interface ContainerOptions {
  element?: HTMLElement
  borderRadius?: number
  type?: 'rounded' | 'circle' | 'pill'
  tintOpacity?: number
}

export class Container {
  static resetPageSnapshot(): void
  constructor(options?: ContainerOptions)
  updateSizeFromDOM(): void
  render?: () => void
  destroy(): void
}
