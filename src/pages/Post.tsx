import { Link, useParams } from 'react-router-dom'
import { useState, useEffect, type KeyboardEvent, type MouseEvent } from 'react'
import Topbar from '../components/Topbar'
import WallpaperStage from '../components/WallpaperStage'
import { formatDate, sortPostsByDate } from '../lib/posts'
import postImages from '../content/postImages'
import posts from '../content/posts'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'

interface MdxModule {
  default: React.ComponentType
}

interface ExpandedImage {
  src: string
  alt: string
}

export default function Post() {
  const { slug } = useParams<{ slug: string }>()
  const postMeta = posts.find((post) => post.slug === slug)
  const sortedPosts = sortPostsByDate(posts)
  const postIndex = sortedPosts.findIndex((post) => post.slug === slug)
  const newerPost = postIndex > 0 ? sortedPosts[postIndex - 1] : null
  const olderPost =
    postIndex >= 0 && postIndex < sortedPosts.length - 1
      ? sortedPosts[postIndex + 1]
      : null
  const [PostContent, setPostContent] = useState<React.ComponentType | null>(null)
  const [readingProgress, setReadingProgress] = useState(0)
  const [expandedImage, setExpandedImage] = useState<ExpandedImage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadingGlassRef = useLiquidGlassSurface<HTMLDivElement>({
    borderRadius: 30,
    type: 'rounded',
  })
  const errorGlassRef = useLiquidGlassSurface<HTMLDivElement>({
    borderRadius: 30,
    type: 'rounded',
  })
  const articleGlassRef = useLiquidGlassSurface<HTMLElement>({
    borderRadius: 30,
    type: 'rounded',
  })

  useEffect(() => {
    async function loadPost() {
      setLoading(true)
      setError(null)
      setPostContent(null)

      if (!slug || !postMeta) {
        setError('Post not found')
        setLoading(false)
        return
      }

      try {
        const module = (await import(`../content/${slug}.mdx`)) as MdxModule
        setPostContent(() => module.default)
      } catch {
        setError('Post not found')
      } finally {
        setLoading(false)
      }
    }
    loadPost()
  }, [slug, postMeta])

  useEffect(() => {
    document.title = postMeta ? `${postMeta.title} | Jorgeasaurus` : 'Jorgeasaurus'
  }, [postMeta])

  useEffect(() => {
    if (!PostContent) {
      return
    }

    const images = document.querySelectorAll<HTMLImageElement>('.post-content img')

    images.forEach((image) => {
      image.tabIndex = 0
      image.setAttribute('role', 'button')
      image.setAttribute(
        'aria-label',
        image.alt ? `Open image: ${image.alt}` : 'Open image'
      )
    })
  }, [PostContent])

  useEffect(() => {
    if (!expandedImage) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        setExpandedImage(null)
      }
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [expandedImage])

  useEffect(() => {
    function updateReadingProgress() {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight

      if (scrollableHeight <= 0) {
        setReadingProgress(0)
        return
      }

      const progress = Math.min(
        1,
        Math.max(0, window.scrollY / scrollableHeight)
      )

      setReadingProgress(progress)
    }

    updateReadingProgress()
    window.addEventListener('scroll', updateReadingProgress, { passive: true })
    window.addEventListener('resize', updateReadingProgress)

    return () => {
      window.removeEventListener('scroll', updateReadingProgress)
      window.removeEventListener('resize', updateReadingProgress)
    }
  }, [PostContent])

  function openExpandedImage(image: HTMLImageElement) {
    setExpandedImage({
      src: image.currentSrc || image.src,
      alt: image.alt,
    })
  }

  function handlePostContentClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target

    if (!(target instanceof Element)) {
      return
    }

    const image = target.closest<HTMLImageElement>('img')

    if (!image) {
      return
    }

    event.preventDefault()
    openExpandedImage(image)
  }

  function handlePostContentKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    const target = event.target

    if (!(target instanceof HTMLImageElement)) {
      return
    }

    event.preventDefault()
    openExpandedImage(target)
  }

  if (loading) {
    return (
      <main className="blog-shell">
        <WallpaperStage />
        <Topbar />
        <div className="content-panel glass-panel" ref={loadingGlassRef}>
          <div className="loading-inline">
            <div className="spinner" />
            Loading...
          </div>
        </div>
      </main>
    )
  }

  if (error || !postMeta || !PostContent) {
    return (
      <main className="blog-shell">
        <WallpaperStage />
        <Topbar />
        <div className="content-panel glass-panel" ref={errorGlassRef}>
          <h1>Post Not Found</h1>
          <p className="hero-copy">
            The post you're looking for doesn't exist.
          </p>
        </div>
      </main>
    )
  }

  const images = postImages[slug ?? ''] ?? []
  const [heroImage] = images
  const hasArticleHero = images.length === 1 && heroImage

  return (
    <main className="blog-shell">
      <WallpaperStage />
      <Topbar />
      <div
        className="reading-progress"
        style={{ transform: `scaleX(${readingProgress})` }}
        aria-hidden="true"
      />
      <article className="content-panel glass-panel" ref={articleGlassRef}>
        <header>
          <p className="post-card-date">{formatDate(postMeta.date)}</p>
          <h1>{postMeta.title}</h1>
          {postMeta.description && (
            <p className="hero-copy">{postMeta.description}</p>
          )}
        </header>
        {hasArticleHero && (
          <figure className="post-hero-figure">
            <button
              className="image-expand-trigger image-expand-trigger--hero"
              type="button"
              onClick={() =>
                setExpandedImage({
                  src: heroImage.src,
                  alt: heroImage.alt || postMeta.title,
                })
              }
              aria-label={`Open image: ${heroImage.alt || postMeta.title}`}
            >
              <img
                src={heroImage.src}
                alt={heroImage.alt || postMeta.title}
                loading="eager"
              />
            </button>
            {heroImage.caption && <figcaption>{heroImage.caption}</figcaption>}
          </figure>
        )}
        <div
          className="post-content"
          onClick={handlePostContentClick}
          onKeyDown={handlePostContentKeyDown}
        >
          <PostContent />
        </div>
        {(newerPost || olderPost) && (
          <nav className="article-nav" aria-label="Adjacent field notes">
            {newerPost ? (
              <Link className="article-nav-link" to={`/${newerPost.slug}`}>
                <span>Newer field note</span>
                <strong>{newerPost.title}</strong>
              </Link>
            ) : (
              <span className="article-nav-link article-nav-link--empty" />
            )}
            {olderPost ? (
              <Link className="article-nav-link article-nav-link--next" to={`/${olderPost.slug}`}>
                <span>Older field note</span>
                <strong>{olderPost.title}</strong>
              </Link>
            ) : (
              <span className="article-nav-link article-nav-link--empty" />
            )}
          </nav>
        )}
      </article>
      {expandedImage && (
        <div
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Expanded image preview"
          onClick={() => setExpandedImage(null)}
        >
          <button
            className="image-lightbox__close"
            type="button"
            onClick={() => setExpandedImage(null)}
            aria-label="Close expanded image"
          >
            x
          </button>
          <img
            className="image-lightbox__image"
            src={expandedImage.src}
            alt={expandedImage.alt}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </main>
  )
}
