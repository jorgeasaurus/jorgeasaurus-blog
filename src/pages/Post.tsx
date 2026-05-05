import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import WallpaperStage from '../components/WallpaperStage'
import { formatDate } from '../lib/posts'
import postImages from '../content/postImages'
import posts from '../content/posts'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'

interface MdxModule {
  default: React.ComponentType
}

export default function Post() {
  const { slug } = useParams<{ slug: string }>()
  const postMeta = posts.find((post) => post.slug === slug)
  const [PostContent, setPostContent] = useState<React.ComponentType | null>(null)
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

  return (
    <main className="blog-shell">
      <WallpaperStage />
      <Topbar />
      <article className="content-panel glass-panel" ref={articleGlassRef}>
        <header>
          <p className="post-card-date">{formatDate(postMeta.date)}</p>
          <h1>{postMeta.title}</h1>
          {postMeta.description && (
            <p className="hero-copy">{postMeta.description}</p>
          )}
        </header>
        {images.length > 0 && (
          <section
            className={`post-media ${
              images.length === 1 ? 'post-media--single' : ''
            }`}
            aria-label="Images from the original post"
          >
            {images.length > 1 && (
              <p className="eyebrow">Original media</p>
            )}
            <div className="post-media-grid">
              {images.map((image) => (
                <figure className="post-media-item" key={image.src}>
                  <img
                    src={image.src}
                    alt={image.alt || postMeta.title}
                    loading="lazy"
                  />
                  {image.caption && <figcaption>{image.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </section>
        )}
        <div className="post-content">
          <PostContent />
        </div>
      </article>
    </main>
  )
}
