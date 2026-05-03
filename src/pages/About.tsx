import Topbar from '../components/Topbar'
import WallpaperStage from '../components/WallpaperStage'
import SocialIcon from '../components/SocialIcon'

export default function About() {
  return (
    <main className="blog-shell">
      <WallpaperStage />
      <Topbar />
      <article
        className="glass-panel"
        style={{ gridArea: 'content' }}
      >
        <div className="about-header">
          <div>
            <p className="eyebrow">About</p>
            <h1>Jorge Suarez</h1>
          </div>
          <a
            className="mvp-badge-link"
            href="https://mvp.microsoft.com/en-US/MVP/profile/79a79af0-1218-4504-b4ee-082ae4ff75f6"
            target="_blank"
            rel="noreferrer"
            aria-label="Microsoft MVP profile"
          >
            <img
              src="/images/mvp-badge.png"
              alt="Microsoft Most Valuable Professional"
              className="mvp-badge"
            />
          </a>
        </div>
        <div className="about-content">
          <p>
            I'm Jorge. I write about PowerShell, automation, and engineering.
          </p>
          <p>
            This blog is built with React, Vite, and MDX — deployed on Vercel.
          </p>
          <div className="profile-links" aria-label="Profile links">
            <a href="https://github.com/jorgeasaurus" target="_blank" rel="noreferrer">
              <SocialIcon name="github" />
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/jorgeasaurus/" target="_blank" rel="noreferrer">
              <SocialIcon name="linkedin" />
              LinkedIn
            </a>
            <a
              href="https://mvp.microsoft.com/en-US/MVP/profile/79a79af0-1218-4504-b4ee-082ae4ff75f6"
              target="_blank"
              rel="noreferrer"
            >
              Microsoft MVP
            </a>
          </div>
        </div>
      </article>
    </main>
  )
}
