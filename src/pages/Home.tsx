import usePageMetadata from '../hooks/usePageMetadata'
import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Topbar from '../components/Topbar'
import PostCard from '../components/PostCard'
import PostFilters from '../components/PostFilters'
import NewsletterSignup from '../components/NewsletterSignup'
import SocialIcon from '../components/SocialIcon'
import WallpaperStage from '../components/WallpaperStage'
import { sortPostsByDate } from '../lib/posts'
import { categoryLabel, filterPosts, listingPath } from '../lib/postSearch.mjs'
import posts from '../content/posts'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'

const POSTS_PER_PAGE = 5

export default function Home() {
  const [searchParams] = useSearchParams()
  const heroGlassRef = useLiquidGlassSurface<HTMLElement>({
    borderRadius: 44,
    type: 'rounded',
  })

  const [searchText, setSearchText] = useState<Record<string, string>>()
  const query = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? ''
  const activeTag = searchParams.get('tag') ?? ''
  const searchPending = Boolean(query.trim()) && !searchText
  const sorted = sortPostsByDate(posts)
  const filtered = searchPending
    ? []
    : filterPosts(sorted, { query, category, tag: activeTag }, searchText ?? {})
  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE))
  const requestedPage = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const currentPage = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages
  )
  const filtersActive = Boolean(query.trim() || category || activeTag)
  const isFiltered = filtersActive || currentPage > 1
  const pageStart = (currentPage - 1) * POSTS_PER_PAGE
  const visiblePosts = filtered.slice(pageStart, pageStart + POSTS_PER_PAGE)
  const heading = activeTag
    ? `Tagged: ${activeTag}`
    : category
      ? `Category: ${categoryLabel(category)}`
      : query.trim()
        ? 'Search results'
        : 'Recent field notes'

  usePageMetadata('home', { filtered: isFiltered })

  useEffect(() => {
    let canceled = false
    void import('virtual:post-search-text').then(
      (module) => {
        if (!canceled) setSearchText(module.default)
      },
      () => {
        if (!canceled) setSearchText({})
      },
    )
    return () => {
      canceled = true
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentPage, activeTag, category, query])

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
            <h2>{heading}</h2>
          </div>
          {filtersActive && (
            <Link className="tag-filter-clear" to="/">
              Clear filter ×
            </Link>
          )}
        </div>
        <PostFilters posts={posts} matchCount={filtered.length} pending={searchPending} />
        {visiblePosts.map((post, index) => (
          <PostCard
            key={post.slug}
            post={post}
            featured={index === 0 && currentPage === 1 && !filtersActive}
          />
        ))}
        {totalPages > 1 && (
          <nav className="pagination" aria-label="Posts pagination">
            {currentPage > 1 ? (
              <Link className="pagination-link pagination-link--wide" to={listingPath({ q: query, category, tag: activeTag, page: currentPage - 1 })}>
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
                  <Link className="pagination-link" to={listingPath({ q: query, category, tag: activeTag, page })} key={page}>
                    {page}
                  </Link>
                )
              })}
            </div>
            {currentPage < totalPages ? (
              <Link className="pagination-link pagination-link--wide" to={listingPath({ q: query, category, tag: activeTag, page: currentPage + 1 })}>
                Older →
              </Link>
            ) : (
              <span className="pagination-link pagination-link--wide pagination-link--disabled">
                Older →
              </span>
            )}
          </nav>
        )}
        <NewsletterSignup />
      </section>
    </main>
  )
}
