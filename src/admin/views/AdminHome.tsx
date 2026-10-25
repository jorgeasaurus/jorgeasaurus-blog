import usePageMetadata from '../../hooks/usePageMetadata'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import PostCard from '../AdminPostCard'
import PostFilters from '../../components/PostFilters'
import NewsletterSignup from '../../components/NewsletterSignup'
import SocialIcon from '../../components/SocialIcon'
import AdminShell from '../AdminShell'
import Breadcrumbs from '../Breadcrumbs'
import CommandBar from '../CommandBar'
import Dashboard from '../Dashboard'
import { sortColumns, sortListing, type SortDirection, type SortKey } from '../sortListing'
import { sortPostsByDate } from '../../lib/posts'
import { categoryLabel, filterPosts, listingPath } from '../../lib/postSearch.mjs'
import { readingMinutes } from '../../lib/readingTime'
import posts from '../../content/posts'

const POSTS_PER_PAGE = 5

function scrollToAdminHash(hash: string) {
  const id = decodeURIComponent(hash.replace(/^#/, ''))
  if (!id) return false
  const target = document.getElementById(id)
  if (!target) return false
  const headerBottom = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0
  const top = target.getBoundingClientRect().top + window.scrollY - headerBottom - 12
  window.scrollTo(0, Math.max(0, top))
  return true
}

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

export default function AdminHome() {
  const [searchParams] = useSearchParams()
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('descending')

  const { hash } = useLocation()
  const category = searchParams.get('category') ?? ''
  const activeTag = searchParams.get('tag') ?? ''
  const sorted = sortPostsByDate(posts)
  const sequenceBySlug = new Map(sorted.map((post, index) => [post.slug, sorted.length - index]))
  const filtered = filterPosts(sorted, { category, tag: activeTag })
  const ordered = sortListing(filtered, sortKey, sortDirection)
  const totalPages = Math.max(1, Math.ceil(ordered.length / POSTS_PER_PAGE))
  const requestedPage = Number.parseInt(searchParams.get('page') ?? '1', 10)
  const currentPage = Math.min(
    Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1),
    totalPages
  )
  const filtersActive = Boolean(category || activeTag)
  const isFiltered = filtersActive || currentPage > 1
  const pageStart = (currentPage - 1) * POSTS_PER_PAGE
  const visiblePosts = ordered.slice(pageStart, pageStart + POSTS_PER_PAGE)
  const heading = activeTag
    ? `Tagged: ${activeTag}`
    : category
      ? `Category: ${categoryLabel(category)}`
      : 'Recent field notes'
  const defaultListing = !filtersActive && currentPage === 1 && sortKey === 'date' && sortDirection === 'descending'
  const showOverview = defaultListing || hash === '#overview'
  const homeCrumb = { label: 'Home', to: '/', onClick: scrollToTopOnPrimaryClick }
  const crumbs = filtersActive
    ? [
        homeCrumb,
        { label: 'Posts', to: '/#posts' },
        { label: activeTag ? `Tagged: ${activeTag}` : categoryLabel(category) },
      ]
    : [homeCrumb, { label: 'Posts' }]

  usePageMetadata('home', { filtered: isFiltered })

  const filtersKey = `${category}\0${activeTag}`
  const scrollState = useRef({ page: currentPage, filters: filtersKey })
  const postsOffset = useRef<number | null>(null)

  function postsDelta() {
    const postsSection = document.getElementById('posts')
    const header = document.querySelector('.topbar')
    if (!postsSection || !header) return null
    return postsSection.getBoundingClientRect().top - header.getBoundingClientRect().bottom
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollState.current = { page: currentPage, filters: filtersKey }
    })
    return () => cancelAnimationFrame(frame)
  }, [currentPage, filtersKey])

  useLayoutEffect(() => {
    if (window.location.hash) return
    const next = postsDelta()
    if (next === null) return
    const previous = postsOffset.current
    if (previous !== null && window.scrollY >= 2 && Math.abs(next - previous) > 2) {
      window.scrollBy(0, next - previous)
    }
    postsOffset.current = postsDelta()
  }, [filtersKey, showOverview])

  useEffect(() => {
    if (!hash) return
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        scrollToAdminHash(hash)
        postsOffset.current = postsDelta()
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [hash])

  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0)
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
      if (window.location.hash) return
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

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((direction) => (direction === 'ascending' ? 'descending' : 'ascending'))
      return
    }
    setSortKey(key)
    setSortDirection(key === 'title' || key === 'category' ? 'ascending' : 'descending')
  }

  return (
    <AdminShell>
      <Breadcrumbs items={crumbs} />
      <section className="hero-panel" aria-labelledby="home-title">
        <div className="hero-layout">
          <div className="hero-title-block">
            <h1 id="home-title">Jorgeasaurus</h1>
            <p className="hero-signal">Learn. Build. Automate.</p>
          </div>
          <div className="hero-intro">
            <p className="hero-copy">
              Practical engineering notes on PowerShell, endpoint management,
              Microsoft Graph, and building durable automation systems.
            </p>
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
      <CommandBar mode="list" />
      {showOverview && <Dashboard posts={posts} />}
      <section className="content-area" id="posts">
        <div className="listing-tools">
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
        <div className="ac-grid-scroll">
          <div className="ac-grid" role="table" aria-label="Posts">
            <div className="ac-grid-head" role="row">
              {sortColumns.map((column) => {
                const active = sortKey === column.key
                return (
                  <div
                    key={column.key}
                    role="columnheader"
                    aria-sort={active ? sortDirection : 'none'}
                  >
                    <button type="button" onClick={() => toggleSort(column.key)}>
                      {column.label}
                      {active && (
                        <span aria-hidden="true">{sortDirection === 'ascending' ? ' ↑' : ' ↓'}</span>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
            {visiblePosts.map((post, index) => (
              <PostCard
                key={post.slug}
                post={post}
                featured={index === 0 && defaultListing}
                sequence={sequenceBySlug.get(post.slug) ?? 0}
                minutes={readingMinutes(post.slug)}
              />
            ))}
          </div>
        </div>
        {totalPages > 1 && (
          <nav className="pagination" aria-label="Posts pagination">
            {currentPage > 1 ? (
              <Link className="pagination-link pagination-link--wide" to={listingPath({ category, tag: activeTag, page: currentPage - 1 })} onClick={scrollToTopOnPrimaryClick}>
                ← Newer
              </Link>
            ) : (
              <span className="pagination-slot" aria-hidden="true" />
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
    </AdminShell>
  )
}
