import Topbar from '../components/Topbar'
import WallpaperStage from '../components/WallpaperStage'
import SocialIcon from '../components/SocialIcon'

export default function About() {
  return (
    <main className="blog-shell blog-shell--about">
      <WallpaperStage />
      <Topbar />
      <article className="about-panel glass-panel">
        <div className="about-header">
          <div className="about-heading">
            <p className="eyebrow">About</p>
            <h1>Jorge Suarez</h1>
            <p className="about-lede">
              Client platforms engineer, Microsoft MVP, and automation builder
              focused on PowerShell, Microsoft Graph, Intune, and durable
              endpoint systems.
            </p>
          </div>
          <a
            className="mvp-badge-link"
            href="https://mvp.microsoft.com/en-US/MVP/profile/79a79af0-1218-4504-b4ee-082ae4ff75f6"
            target="_blank"
            rel="noopener noreferrer"
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
            I am an automation-driven systems engineer with 8+ years of
            experience building scalable endpoint platforms across Windows,
            macOS, iOS, Android, and cloud-managed environments. My work sits at
            the intersection of endpoint management, identity, security,
            developer tooling, and code-driven operations.
          </p>
          <p>
            Today I focus on endpoint and identity platform architecture at
            enterprise scale: designing automations, dashboards, remediation
            workflows, and operational guardrails that make large fleets easier
            to manage and harder to break. PowerShell, Microsoft Graph, Intune,
            Jamf, MECM, CI/CD, and infrastructure-as-code patterns are the tools
            I reach for most often.
          </p>
          <p>
            Before that, I worked through the full stack of client platform
            operations: desktop support, systems engineering, application
            packaging, SCCM and Intune migrations, Docker and cloud platform
            automation, monitoring, and large-scale workstation provisioning. A
            lot of my opinions come from living with the operational consequences
            of the tools we build.
          </p>
          <p>
            This site is my field notebook: scripts, architecture notes,
            implementation lessons, and the occasional hard-earned opinion from
            endpoint and automation work. The blog itself is built with React,
            Vite, and MDX, and deployed on Vercel.
          </p>
          <div className="profile-links" aria-label="Profile links">
            <a href="https://github.com/jorgeasaurus" target="_blank" rel="noopener noreferrer">
              <SocialIcon name="github" />
              GitHub
            </a>
            <a href="https://www.linkedin.com/in/jorgeasaurus/" target="_blank" rel="noopener noreferrer">
              <SocialIcon name="linkedin" />
              LinkedIn
            </a>
          </div>
        </div>
      </article>
    </main>
  )
}
