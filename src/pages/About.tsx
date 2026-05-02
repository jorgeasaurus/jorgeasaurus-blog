import Topbar from '../components/Topbar'

export default function About() {
  return (
    <main className="blog-shell">
      <Topbar />
      <div style={{ gridArea: 'content' }}>
        <div className="glass-panel">
          <h1>About</h1>
          <div className="about-content">
            <p>
              I'm Jorge. I write about PowerShell, automation, and engineering.
            </p>
            <p>
              This blog is built with React, Vite, and MDX — deployed on Vercel.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
