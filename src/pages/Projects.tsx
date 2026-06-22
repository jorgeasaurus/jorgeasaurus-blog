import { useEffect } from 'react'
import Topbar from '../components/Topbar'
import WallpaperStage from '../components/WallpaperStage'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'

interface Project {
  name: string
  href: string
  kind: string
  description: string
  tags: string[]
  cta: string
}

const featuredProjects: Project[] = [
  {
    name: 'Intune Hydration Kit',
    href: 'https://www.intunehydrationkit.com/',
    kind: 'Product',
    description:
      'Bootstrap Microsoft Intune tenants with baseline policies, compliance, Conditional Access, Microsoft Graph deployment, previews, and safety checks.',
    tags: ['Intune', 'Graph', 'Automation'],
    cta: 'Visit site',
  },
  {
    name: 'Endpoint Jobs',
    href: 'https://endpointjobs.dev/',
    kind: 'Job board',
    description:
      'Focused job board for endpoint engineering, MDM, UEM, client platform, and endpoint security roles.',
    tags: ['Endpoint', 'Careers', 'MDM'],
    cta: 'Visit site',
  },
  {
    name: 'Graph Explorer Plus',
    href: 'https://graphexplorerpl.us/',
    kind: 'Graph app',
    description:
      'Power-user Microsoft Graph explorer with curated samples, resource browsing, code snippets, and sovereign cloud support.',
    tags: ['TypeScript', 'Graph', 'Next.js'],
    cta: 'Visit site',
  },
  {
    name: 'NukeTune',
    href: 'https://nuketune.com/',
    kind: 'Tenant reset',
    description:
      'Bulk deletion tool for resetting Intune environments across devices, apps, policies, and configurations.',
    tags: ['TypeScript', 'Intune', 'Graph'],
    cta: 'Visit site',
  },
  {
    name: 'Intune Gazette',
    href: 'https://jorgeasaurus.github.io/IntuneDocsAutomation/',
    kind: 'Docs tracker',
    description:
      'Static newspaper-style dashboard that tracks Microsoft Intune documentation updates from Microsoft Learn.',
    tags: ['Intune', 'Docs', 'GitHub Actions'],
    cta: 'Visit site',
  },
]

const repositoryProjects: Project[] = [
  {
    name: 'InTUI',
    href: 'https://github.com/jorgeasaurus/InTUI',
    kind: 'Terminal UI',
    description:
      'PowerShell terminal interface for managing Microsoft Intune through Microsoft Graph.',
    tags: ['PowerShell', 'Intune', 'TUI'],
    cta: 'View repository',
  },
  {
    name: 'Win32Forge',
    href: 'https://jorgeasaurus.github.io/Win32Forge/',
    kind: 'Packaging',
    description:
      'Package, publish, and deploy Intune Win32 apps with repeatable metadata and Graph upload workflows.',
    tags: ['PowerShell', 'Intune', 'Win32'],
    cta: 'Visit site',
  },
  {
    name: 'MgGraphIndex',
    href: 'https://jorgeasaurus.github.io/MgGraphIndex/',
    kind: 'Reference',
    description:
      'Searchable static index for Microsoft Graph PowerShell cmdlets, refreshed by GitHub Actions.',
    tags: ['Graph', 'PowerShell', 'Reference'],
    cta: 'Visit site',
  },
  {
    name: 'PSModuleBrowser',
    href: 'https://github.com/jorgeasaurus/PSModuleBrowser',
    kind: 'Terminal UI',
    description:
      'Keyboard-driven terminal interface for searching, inspecting, and installing PowerShell Gallery modules.',
    tags: ['PowerShell', 'Gallery', 'TUI'],
    cta: 'View repository',
  },
  {
    name: 'WinGet-Manifest-Fetcher',
    href: 'https://github.com/jorgeasaurus/WinGet-Manifest-Fetcher',
    kind: 'Module',
    description:
      'PowerShell module for reading installer details from WinGet manifests without requiring the WinGet client.',
    tags: ['PowerShell', 'WinGet', 'Packaging'],
    cta: 'View repository',
  },
  {
    name: 'FleetDM-PowerShell',
    href: 'https://github.com/jorgeasaurus/FleetDM-PowerShell',
    kind: 'API wrapper',
    description: 'PowerShell wrapper module for the FleetDM API.',
    tags: ['PowerShell', 'FleetDM', 'API'],
    cta: 'View repository',
  },
  {
    name: 'WinStoreRip',
    href: 'https://github.com/jorgeasaurus/WinStoreRip',
    kind: 'CLI',
    description:
      'Command-line tool for querying and downloading Windows Store app packages.',
    tags: ['PowerShell', 'Windows Store', 'CLI'],
    cta: 'View repository',
  },
  {
    name: 'PSRedditTUI',
    href: 'https://github.com/jorgeasaurus/PSRedditTUI',
    kind: 'Terminal UI',
    description:
      'PowerShell terminal interface for browsing Reddit, favorites, and subreddit data through JSON endpoints.',
    tags: ['PowerShell', 'Reddit', 'TUI'],
    cta: 'View repository',
  },
  {
    name: 'JamfAssignmentChecker',
    href: 'https://github.com/jorgeasaurus/JamfAssignmentChecker',
    kind: 'Audit tool',
    description: 'Checks Jamf Pro assignments across computers, users, and groups.',
    tags: ['PowerShell', 'Jamf', 'Audit'],
    cta: 'View repository',
  },
  {
    name: 'Intune-Snapshot-Recovery',
    href: 'https://github.com/jorgeasaurus/Intune-Snapshot-Recovery',
    kind: 'Recovery',
    description:
      'PowerShell and GitHub Actions toolkit for backing up and restoring Intune tenant configuration.',
    tags: ['PowerShell', 'Intune', 'Backup'],
    cta: 'View repository',
  },
  {
    name: 'PsJamfBackupRestore',
    href: 'https://github.com/jorgeasaurus/PsJamfBackupRestore',
    kind: 'Recovery',
    description:
      'PowerShell utility for backing up and restoring Jamf Pro configuration through the Jamf API.',
    tags: ['PowerShell', 'Jamf', 'Backup'],
    cta: 'View repository',
  },
  {
    name: 'MgConsoleGuiGraphSearch',
    href: 'https://github.com/jorgeasaurus/MgConsoleGuiGraphSearch',
    kind: 'Console GUI',
    description:
      'Console GUI search for Microsoft Graph objects across Microsoft 365 and Entra.',
    tags: ['PowerShell', 'Graph', 'Console'],
    cta: 'View repository',
  },
  {
    name: 'PSIntuneWinDetection',
    href: 'https://github.com/jorgeasaurus/PSIntuneWinDetection',
    kind: 'Generator',
    description:
      'Reusable generator for PowerShell detection scripts used by Windows app deployments.',
    tags: ['PowerShell', 'Intune', 'Detection'],
    cta: 'View repository',
  },
  {
    name: 'PS-MDR',
    href: 'https://github.com/jorgeasaurus/PS-MDR',
    kind: 'Game',
    description:
      'Console-based interactive game implemented in PowerShell around macro data refinement.',
    tags: ['PowerShell', 'Game', 'Console'],
    cta: 'View repository',
  },
]

function ProjectCard({ project, featured = false }: { project: Project; featured?: boolean }) {
  return (
    <article className={`project-card ${featured ? 'project-card--featured' : ''}`}>
      <div className="project-card-heading">
        <p className="project-kind">{project.kind}</p>
        <h2>{project.name}</h2>
      </div>
      <p className="project-description">{project.description}</p>
      <div className="project-tags" aria-label={`${project.name} tags`}>
        {project.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>
      <a
        className="project-link"
        href={project.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${project.cta}: ${project.name}`}
      >
        {project.cta}
      </a>
    </article>
  )
}

export default function Projects() {
  const heroGlassRef = useLiquidGlassSurface<HTMLElement>({
    borderRadius: 38,
    type: 'rounded',
  })

  useEffect(() => {
    document.title = 'Projects | Jorgeasaurus'
  }, [])

  return (
    <main className="blog-shell blog-shell--projects">
      <WallpaperStage />
      <Topbar />
      <section className="projects-hero glass-panel" ref={heroGlassRef}>
        <div className="projects-hero-copy">
          <p className="eyebrow">Projects</p>
          <h1>Tools for endpoint work</h1>
          <p className="hero-copy">
            Apps, modules, terminal interfaces, and automation projects around
            Intune, Microsoft Graph, PowerShell, Jamf, packaging, and endpoint
            operations.
          </p>
        </div>
      </section>
      <section className="content-area projects-area">
        <div className="content-heading">
          <div>
            <p className="eyebrow">Featured</p>
            <h2>Live projects</h2>
          </div>
        </div>
        <div className="projects-grid projects-grid--featured">
          {featuredProjects.map((project) => (
            <ProjectCard project={project} featured key={project.name} />
          ))}
        </div>
        <div className="content-heading">
          <div>
            <p className="eyebrow">Open source</p>
            <h2>Repos and experiments</h2>
          </div>
        </div>
        <div className="projects-grid">
          {repositoryProjects.map((project) => (
            <ProjectCard project={project} key={project.name} />
          ))}
        </div>
      </section>
    </main>
  )
}
