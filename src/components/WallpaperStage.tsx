import { useLocation } from 'react-router-dom'

export default function WallpaperStage() {
  const { pathname } = useLocation()

  return (
    <>
      <div className="wallpaper-stage" aria-hidden="true" />
      {pathname !== '/social-card' && (
        <p className="backdrop-credit">
          Backdrop:{' '}
          <a
            href="https://commons.wikimedia.org/wiki/File:Colchuck_Lake_(11_October_2024)_10.jpg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Colchuck Lake
          </a>
          {' '}by{' '}
          <a
            href="https://commons.wikimedia.org/wiki/User:Buidhe"
            target="_blank"
            rel="noopener noreferrer"
          >
            Buidhe
          </a>
          {', '}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
          >
            CC BY-SA 4.0
          </a>
          {' '}(cropped to 16:9, WebP)
        </p>
      )}
    </>
  )
}
