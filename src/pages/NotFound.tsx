import usePageMetadata from '../hooks/usePageMetadata'
import { Link } from 'react-router-dom'
import Topbar from '../components/Topbar'
import WallpaperStage from '../components/WallpaperStage'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'

export default function NotFound() {
  const glassRef = useLiquidGlassSurface<HTMLDivElement>({
    borderRadius: 30,
    type: 'rounded',
  })

  usePageMetadata('not-found')

  return (
    <main className="blog-shell">
      <WallpaperStage />
      <Topbar />
      <div className="content-panel glass-panel" ref={glassRef}>
        <h1>Page Not Found</h1>
        <p className="hero-copy">
          The page you're looking for doesn't exist.
        </p>
        <p>
          <Link to="/">Back to home</Link>
        </p>
      </div>
    </main>
  )
}
