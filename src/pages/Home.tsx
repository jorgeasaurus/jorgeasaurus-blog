import { Link, useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import Topbar from '../components/Topbar'
import PostCard from '../components/PostCard'
import SocialIcon from '../components/SocialIcon'
import WallpaperStage from '../components/WallpaperStage'
import { sortPostsByDate } from '../lib/posts'
import posts from '../content/posts'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'

const POSTS_PER_PAGE = 5

function getPagePath(page: number) {
  return page === 1 ? '/' : `/?page=${page}`
}

export default function Home() {
  useEffect(() => {
    document.title = 'Jorgeasaurus'
  }, [])

  const [searchParams] = useSearchParams()
  const sorted = sortPostsByDate(posts)
  const totalPages = Math.max(1, Math.ceil(sorted.length / POSTS_PER_PAGE))
  const requestedPage = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const currentPage = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages
  )
  const pageStart = (currentPage - 1) * POSTS_PER_PAGE
  const visiblePosts = sorted.slice(pageStart, pageStart + POSTS_PER_PAGE)
  const [featuredPost, ...archivePosts] = visiblePosts
  const showFeaturedCard = currentPage === 1
  const heroGlassRef = useLiquidGlassSurface<HTMLElement>({
    borderRadius: 44,
    type: 'rounded',
  })

  return (
    <main className="blog-shell">
      <WallpaperStage />
      <Topbar />
      <section className="hero-panel glass-panel" ref={heroGlassRef}>
        <div className="hero-layout">
          <div className="hero-title-block">
            <h1>
              <span aria-hidden="true">&gt;</span>
              Jorgeasaurus
            </h1>
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
          <div>
            <p className="eyebrow">Posts</p>
            <h2>Recent field notes</h2>
          </div>
        </div>
        {featuredPost && <PostCard post={featuredPost} featured={showFeaturedCard} />}
        {archivePosts.map((post) => (
          <PostCard key={post.slug} post={post} />
        ))}
        {totalPages > 1 && (
          <nav className="pagination" aria-label="Posts pagination">
            {currentPage > 1 ? (
              <Link className="pagination-link pagination-link--wide" to={getPagePath(currentPage - 1)}>
                ← Newer
              </Link>
            ) : (
              <span className="pagination-link pagination-link--wide pagination-link--disabled">
                ← Newer
              </span>
            )}
            <div className="pagination-pages">
              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1
                const isCurrent = page === currentPage

                return isCurrent ? (
                  <span
                    className="pagination-link pagination-link--active"
                    aria-current="page"
                    key={page}
                  >
                    {page}
                  </span>
                ) : (
                  <Link className="pagination-link" to={getPagePath(page)} key={page}>
                    {page}
                  </Link>
                )
              })}
            </div>
            {currentPage < totalPages ? (
              <Link className="pagination-link pagination-link--wide" to={getPagePath(currentPage + 1)}>
                Older →
              </Link>
            ) : (
              <span className="pagination-link pagination-link--wide pagination-link--disabled">
                Older →
              </span>
            )}
          </nav>
        )}
      </section>
    </main>
  )
}
