import Topbar from '../components/Topbar'
import PostCard from '../components/PostCard'
import SocialIcon from '../components/SocialIcon'
import WallpaperStage from '../components/WallpaperStage'
import { sortPostsByDate } from '../lib/posts'
import posts from '../content/posts'

export default function Home() {
  const sorted = sortPostsByDate(posts)
  const [featuredPost, ...archivePosts] = sorted

  return (
    <main className="blog-shell">
      <WallpaperStage />
      <Topbar />
      <section className="hero-panel glass-panel">
        <div className="hero-layout">
          <div className="hero-title-block">
            <h1>&gt; Jorgeasaurus</h1>
            <p className="hero-signal">Learn. Build. Automate.</p>
          </div>
          <div className="hero-intro">
            <p className="eyebrow">Field notes from automation work</p>
            <p className="hero-copy">
              Practical engineering notes on PowerShell, endpoint management,
              Microsoft Graph, and building durable automation systems.
            </p>
            <div className="hero-links" aria-label="Profile links">
              <a href="https://github.com/jorgeasaurus" target="_blank" rel="noopener noreferrer">
                <SocialIcon name="github" />
                GitHub
              </a>
              <a href="https://www.linkedin.com/in/jorgeasaurus/" target="_blank" rel="noopener noreferrer">
                <SocialIcon name="linkedin" />
                LinkedIn
              </a>
              <a
                href="https://mvp.microsoft.com/en-US/MVP/profile/79a79af0-1218-4504-b4ee-082ae4ff75f6"
                target="_blank"
                rel="noopener noreferrer"
              >
                <SocialIcon name="microsoft" />
                Microsoft MVP
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="content-area">
        <div className="content-heading">
          <p className="eyebrow">Posts</p>
        </div>
        {featuredPost && <PostCard post={featuredPost} featured />}
        {archivePosts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
      </section>
    </main>
  )
}
