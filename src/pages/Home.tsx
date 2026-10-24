import usePageMetadata from '../hooks/usePageMetadata'
import { Link, useSearchParams } from 'react-router-dom'
import { useEffect, useRef, type MouseEvent } from 'react'
import Topbar from '../components/Topbar'
import PostCard from '../components/PostCard'
import PostFilters from '../components/PostFilters'
import NewsletterSignup from '../components/NewsletterSignup'
import SocialIcon from '../components/SocialIcon'
import WallpaperStage from '../components/WallpaperStage'
import BackdropCredit from '../components/BackdropCredit'
import { sortPostsByDate } from '../lib/posts'
import { categoryLabel, filterPosts, listingPath } from '../lib/postSearch.mjs'
import { readingMinutes } from '../lib/readingTime'
import posts from '../content/posts'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'

const POSTS_PER_PAGE = 5

function scrollToTopOnPrimaryClick(event: MouseEvent<HTMLAnchorElement>) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) return
  window.scrollTo(0, 0)
}

export default function Home() {
  const [searchParams] = useSearchParams()
  const heroGlassRef = useLiquidGlassSurface<HTMLElement>({
    borderRadius: 44,
    type: 'rounded',
  })
  const listingGlassRef = useLiquidGlassSurface<HTMLDivElement>({
    borderRadius: 34,
    type: 'rounded',
  })

  const category = searchParams.get('category') ?? ''
  const activeTag = searchParams.get('tag') ?? ''
  const sorted = sortPostsByDate(posts)
  const latest = sorted[0]
  const sequenceBySlug = new Map(sorted.map((post, index) => [post.slug, sorted.length - index]))
  const filtered = filterPosts(sorted, { category, tag: activeTag })
  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE))
  const requestedPage = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const currentPage = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages
  )
  const filtersActive = Boolean(category || activeTag)
  const isFiltered = filtersActive || currentPage > 1
  const pageStart = (currentPage - 1) * POSTS_PER_PAGE
  const visiblePosts = filtered.slice(pageStart, pageStart + POSTS_PER_PAGE)
  const heading = activeTag
    ? `Tagged: ${activeTag}`
    : category
      ? `Category: ${categoryLabel(category)}`
      : 'Recent field notes'

  usePageMetadata('home', { filtered: isFiltered })

  const filtersKey = `${category}\0${activeTag}`
  const scrollState = useRef({ page: currentPage, filters: filtersKey })

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollState.current = { page: currentPage, filters: filtersKey }
    })
    return () => cancelAnimationFrame(frame)
  }, [currentPage, filtersKey])

  useEffect(() => {
    window.scrollTo(0, 0)
    let resetFrame = 0
    let resetTimer = 0
    let correctUntil = 0
    const snapToTop = () => {
      window.scrollTo(0, 0)
    }
    const onScroll = () => {
      if (performance.now() > correctUntil || window.scrollY === 0) return
      cancelAnimationFrame(resetFrame)
      resetFrame = requestAnimationFrame(snapToTop)
    }
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search)
      const nextFilters = `${params.get('category') ?? ''}\0${params.get('tag') ?? ''}`
      const requested = Number.parseInt(params.get('page') ?? '1', 10)
      const nextPage = Number.isFinite(requested) && requested > 0 ? requested : 1
      const previous = scrollState.current
      if (previous.page === nextPage || previous.filters !== nextFilters) return
      correctUntil = performance.now() + 100
      cancelAnimationFrame(resetFrame)
      window.clearTimeout(resetTimer)
      resetFrame = requestAnimationFrame(() => {
        resetFrame = requestAnimationFrame(snapToTop)
      })
      resetTimer = window.setTimeout(snapToTop, 100)
    }
    window.addEventListener('popstate', onPopState, true)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      cancelAnimationFrame(resetFrame)
      window.clearTimeout(resetTimer)
      window.removeEventListener('popstate', onPopState, true)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [])

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
            <p className="hero-ledger">
              <strong>{posts.length} field notes</strong>
              <span>Intune, PowerShell, Microsoft Graph, endpoint security</span>
            </p>
            <p className="hero-copy">
              Practical engineering notes on PowerShell, endpoint management,
              Microsoft Graph, and building durable automation systems.
            </p>
            {latest && (
              <Link className="hero-latest" to={`/${latest.slug}`}>
                <span className="eyebrow">Latest dispatch</span>
                <strong>{latest.title}</strong>
              </Link>
            )}
            <div className="hero-links" aria-label="Profile links">
              <a href="https://github.com/jorgeasaurus" target="_blank" rel="noopener noreferrer">
                <SocialIcon name="github" />
                GitHub
              </a>
              <a href="https://www.youtube.com/@jorgeasaurus" target="_blank" rel="noopener noreferrer">
                <SocialIcon name="youtube" />
                YouTube
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
        <div className="listing-tools glass-panel" ref={listingGlassRef}>
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
          <PostFilters posts={posts} matchCount={filtered.length} />
        </div>
        {visiblePosts.map((post, index) => (
          <PostCard
            key={post.slug}
            post={post}
            featured={index === 0 && currentPage === 1 && !filtersActive}
            sequence={sequenceBySlug.get(post.slug) ?? 0}
            minutes={readingMinutes(post.slug)}
          />
        ))}
        {totalPages > 1 && (
          <nav className="pagination" aria-label="Posts pagination">
            {currentPage > 1 ? (
              <Link className="pagination-link pagination-link--wide" to={listingPath({ category, tag: activeTag, page: currentPage - 1 })} onClick={scrollToTopOnPrimaryClick}>
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
                  <Link className="pagination-link" to={listingPath({ category, tag: activeTag, page })} key={page} onClick={scrollToTopOnPrimaryClick}>
                    {page}
                  </Link>
                )
              })}
            </div>
            {currentPage < totalPages ? (
              <Link className="pagination-link pagination-link--wide" to={listingPath({ category, tag: activeTag, page: currentPage + 1 })} onClick={scrollToTopOnPrimaryClick}>
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
      <BackdropCredit />
    </main>
  )
}
