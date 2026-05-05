import { useEffect } from 'react'
import WallpaperStage from '../components/WallpaperStage'

export default function SocialCard() {
  useEffect(() => {
    document.title = 'Jorgeasaurus Social Card'
  }, [])

  return (
    <main className="social-card-page" aria-label="Jorgeasaurus social preview">
      <WallpaperStage />
      <section className="social-card-panel" aria-label="Jorgeasaurus">
        <div className="social-card-brand">
          <span aria-hidden="true">&gt;</span>
          <h1>Jorgeasaurus</h1>
        </div>
        <p>Learn. Build. Automate.</p>
      </section>
    </main>
  )
}
