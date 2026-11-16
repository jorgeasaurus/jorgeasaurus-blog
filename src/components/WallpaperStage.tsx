import { useEffect, useRef } from 'react'
import { startGlassPanels } from '../lib/glassPanels'

export default function WallpaperStage() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!stageRef.current || !canvasRef.current) return
    return startGlassPanels(canvasRef.current, stageRef.current)
  }, [])

  return (
    <div className="wallpaper-stage" aria-hidden="true" ref={stageRef}>
      <canvas className="wallpaper-glass" ref={canvasRef} />
    </div>
  )
}
