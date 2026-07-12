import { Link, useParams } from 'react-router-dom'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
} from 'react'
import Topbar from '../components/Topbar'
import NewsletterSignup from '../components/NewsletterSignup'
import WallpaperStage from '../components/WallpaperStage'
import { formatDate, sortPostsByDate } from '../lib/posts'
import postImages from '../content/postImages'
import posts from '../content/posts'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'
import useModalDialog from '../hooks/useModalDialog'

type MdxImageProps = React.ComponentPropsWithoutRef<'img'>

interface MdxComponents {
  img?: React.ComponentType<MdxImageProps>
}

interface MdxContentProps {
  components?: MdxComponents
}

interface MdxModule {
  default: React.ComponentType<MdxContentProps>
}

interface ExpandedImage {
  src: string
  alt: string
}

type OpenExpandedImage = (image: ExpandedImage) => void

interface LightboxDialogProps {
  image: ExpandedImage
  onClose: () => void
}

const ExpandImageContext = createContext<OpenExpandedImage | null>(null)

function ExpandablePostImage({ alt = '', src, ...props }: MdxImageProps) {
  const expandImage = use(ExpandImageContext)

  if (!src || !expandImage) {
    return <img {...props} alt={alt} />
  }

  return (
    <button
      className="image-expand-trigger image-expand-trigger--content"
      type="button"
      onClick={() => expandImage({ src, alt })}
      aria-label={alt ? `Open image: ${alt}` : 'Open image'}
    >
      <img {...props} src={src} alt={alt} />
    </button>
  )
}

const mdxComponents: MdxComponents = {
  img: ExpandablePostImage,
}

function LightboxDialog({ image, onClose }: LightboxDialogProps) {
  const dialogRef = useModalDialog(onClose)

  return (
    <dialog
      ref={dialogRef}
      className="glass-dialog image-lightbox"
      aria-label="Expanded image preview"
    >
      <button
        className="glass-dialog__close image-lightbox__close"
        type="button"
        onClick={onClose}
        aria-label="Close expanded image"
      >
        x
      </button>
      <img
        className="image-lightbox__image"
        src={image.src}
        alt={image.alt}
      />
    </dialog>
  )
}

type PostLoadState =
  | { status: 'loading' }
  | { status: 'loaded'; content: React.ComponentType<MdxContentProps> }
  | { status: 'failed' }

const postModules = import.meta.glob<MdxModule>('../content/*.mdx')

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
  const [postLoad, setPostLoad] = useState<PostLoadState>({
    status: 'loading',
  })
  const [readingProgress, setReadingProgress] = useState(0)
  const [expandedImage, setExpandedImage] = useState<ExpandedImage | null>(null)
  const PostContent = postLoad.status === 'loaded' ? postLoad.content : null
  const openExpandedImage = useCallback((image: ExpandedImage) => {
    setExpandedImage(image)
  }, [])
  const closeExpandedImage = useCallback(() => {
    setExpandedImage(null)
  }, [])
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
    let canceled = false

    async function loadPost() {
      setPostLoad({ status: 'loading' })

      if (!slug || !postMeta) {
        setPostLoad({ status: 'failed' })
        return
      }

      const loadPostModule = postModules[`../content/${slug}.mdx`]

      if (!loadPostModule) {
        setPostLoad({ status: 'failed' })
        return
      }

      try {
        const module = await loadPostModule()

        if (!canceled) {
          setPostLoad({ status: 'loaded', content: module.default })
        }
      } catch {
        if (!canceled) {
          setPostLoad({ status: 'failed' })
        }
      }
    }

    loadPost()

    return () => {
      canceled = true
    }
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

  if (postLoad.status === 'loading') {
    return (
      <main className="blog-shell">
        <WallpaperStage />
        <Topbar />
        <div className="content-panel glass-panel" ref={loadingGlassRef}>
          <div className="loading-inline">
            <div className="spinner" />
            Loading&hellip;
          </div>
        </div>
      </main>
    )
  }

  if (!postMeta || !PostContent) {
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
        <div className="post-content">
          <ExpandImageContext.Provider value={openExpandedImage}>
            <PostContent components={mdxComponents} />
          </ExpandImageContext.Provider>
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
        <NewsletterSignup surface="inline" />
      </article>
      {expandedImage && (
        <LightboxDialog image={expandedImage} onClose={closeExpandedImage} />
      )}
    </main>
  )
}
