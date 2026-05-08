import { Link, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import WallpaperStage from '../components/WallpaperStage'
import { formatDate, sortPostsByDate } from '../lib/posts'
import postImages from '../content/postImages'
import posts from '../content/posts'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'

interface MdxModule {
  default: React.ComponentType
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
            <img
              src={heroImage.src}
              alt={heroImage.alt || postMeta.title}
              loading="eager"
            />
            {heroImage.caption && <figcaption>{heroImage.caption}</figcaption>}
          </figure>
        )}
        <div className="post-content">
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
    </main>
  )
}
