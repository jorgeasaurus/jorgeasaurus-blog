import usePostContent from '../hooks/usePostContent'
import usePageMetadata from '../hooks/usePageMetadata'
import { Link, useParams } from 'react-router-dom'
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import Topbar from '../components/Topbar'
import NewsletterSignup from '../components/NewsletterSignup'
import WallpaperStage from '../components/WallpaperStage'
import ArticleActions from '../components/ArticleActions'
import ArticleWayfinder from '../components/ArticleWayfinder'
import CodeBlock from '../components/CodeBlock'
import { IconClose } from '../components/Icons'
import useReadingProgress from '../components/ReadingProgress'
import { formatDate, sortPostsByDate } from '../lib/posts'
import { categoryLabel, listingPath } from '../lib/postSearch.mjs'
import { collectHeadings, scrollHeadingIntoView, type ArticleHeading } from '../lib/headings'
import { readingMinutes, readingStatus } from '../lib/readingTime'
import { relatedFieldNotes } from '../lib/relatedPosts'
import postImages from '../content/postImages'
import imageMetadata from '../content/imageMetadata'
import posts from '../content/posts'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'
import useModalDialog from '../hooks/useModalDialog'

type MdxImageProps = React.ComponentPropsWithoutRef<'img'>

interface MdxComponents {
  img?: React.ComponentType<MdxImageProps>
  table?: React.ComponentType<React.ComponentPropsWithoutRef<'table'>>
  pre?: React.ComponentType<React.ComponentPropsWithoutRef<'pre'>>
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
  caption?: string
}

type OpenExpandedImage = (image: ExpandedImage, trigger?: HTMLElement | null) => void

interface LightboxDialogProps {
  image: ExpandedImage
  onClose: () => void
}

const ExpandImageContext = createContext<OpenExpandedImage | null>(null)

function captionFrom(trigger: HTMLElement) {
  const caption = trigger.closest('figure')?.querySelector('figcaption')?.textContent?.replace(/\s+/g, ' ').trim()
  return caption || undefined
}

function ExpandablePostImage({ alt = '', src, ...props }: MdxImageProps) {
  const expandImage = use(ExpandImageContext)
  const metadata = src ? imageMetadata[src] : undefined

  if (!src || !expandImage) {
    return <img loading="lazy" {...metadata} {...props} src={src} alt={alt} />
  }

  return (
    <button
      className="image-expand-trigger image-expand-trigger--content"
      type="button"
      onClick={(event) => expandImage(
        { src, alt, caption: captionFrom(event.currentTarget) },
        event.currentTarget,
      )}
      aria-label={alt ? `Open image: ${alt}` : 'Open image'}
    >
      <img loading="lazy" {...metadata} {...props} src={src} alt={alt} />
    </button>
  )
}

function ScrollableTable(props: React.ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="post-table-scroll" role="group" aria-label="Scrollable table" tabIndex={0}>
      <table {...props} />
    </div>
  )
}

const mdxComponents: MdxComponents = {
  img: ExpandablePostImage,
  table: ScrollableTable,
  pre: CodeBlock,
}

function LightboxDialog({ image, onClose }: LightboxDialogProps) {
  const dialogRef = useModalDialog(onClose)

  return (
    <dialog
      ref={dialogRef}
      className="glass-dialog image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Expanded image preview"
    >
      <button
        className="glass-dialog__close image-lightbox__close"
        type="button"
        onClick={onClose}
        aria-label="Close expanded image"
      >
        <IconClose />
      </button>
      <figure className="image-lightbox__figure">
        <img
          className="image-lightbox__image"
          src={image.src}
          alt={image.alt}
        />
        {image.caption && (
          <figcaption className="image-lightbox__caption">{image.caption}</figcaption>
        )}
      </figure>
    </dialog>
  )
}

const postModules = Object.fromEntries(
  Object.entries(import.meta.glob<MdxModule>('../content/*.mdx'))
    .filter(([modulePath]) =>
      posts.some((post) => modulePath.endsWith(`/${post.slug}.mdx`))
    )
)

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
  const postLoad = usePostContent(slug, postModules[`../content/${slug}.mdx`])
  const [outline, setOutline] = useState<ArticleHeading[]>([])
  const [expandedImage, setExpandedImage] = useState<ExpandedImage | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const focusReturnRef = useRef<HTMLElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const PostContent = postLoad.status === 'loaded' ? postLoad.content : null
  const minutes = readingMinutes(slug ?? '')
  useReadingProgress(
    progressRef,
    statusRef,
    contentRef,
    minutes,
    postLoad.status === 'loaded' && Boolean(PostContent),
  )
  const openExpandedImage = useCallback((image: ExpandedImage, trigger?: HTMLElement | null) => {
    focusReturnRef.current = trigger ?? null
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
  const related = postMeta ? relatedFieldNotes(postMeta, posts) : []

  usePageMetadata(!postMeta || postLoad.status === 'failed' ? 'not-found' : 'post', { post: postMeta })

  useLayoutEffect(() => {
    const root = contentRef.current
    if (!root) {
      setOutline([])
      return
    }
    const next = collectHeadings(root)
    for (const list of root.querySelectorAll<HTMLOListElement>(':scope > ol')) {
      const raw = list.getAttribute('start')
      const start = raw === null ? 1 : Number(raw)
      if (!Number.isFinite(start)) continue
      list.style.counterReset = `post-step ${start - 1}`
    }
    setOutline(next)
    let hash: string
    try {
      hash = decodeURIComponent(window.location.hash.replace(/^#/, ''))
    } catch {
      return
    }
    if (!hash) return
    const frame = window.requestAnimationFrame(() => {
      const target = document.getElementById(hash)
      if (!target || !root.contains(target)) return
      scrollHeadingIntoView(target)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [PostContent, slug])

  useEffect(() => {
    if (expandedImage) return
    const target = focusReturnRef.current
    if (!target) return
    focusReturnRef.current = null
    target.focus()
  }, [expandedImage])

  if (postLoad.status === 'loading') {
    return (
      <main className="blog-shell">
        <WallpaperStage />
        <Topbar />
        <div key="loading" className="content-panel glass-panel" ref={loadingGlassRef}>
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
        <div key="missing" className="content-panel glass-panel" ref={errorGlassRef}>
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
        key="progress"
        className="reading-progress"
        ref={progressRef}
        aria-hidden="true"
      />
      <p className="reading-status" ref={statusRef}>
        {readingStatus(minutes, 0)}
      </p>
      <div className={outline.length >= 2 ? 'post-frame post-frame--with-wayfinder' : 'post-frame'}>
      <ArticleWayfinder key={slug} outline={outline} />
      <article key="article" className="content-panel glass-panel" ref={articleGlassRef}>
        <header className="post__header">
          <div className="post__kicker">
            <p className="post-card-date">{formatDate(postMeta.date)}</p>
            <ul className="post-card-tags" aria-label="Post category">
              <li>
                <Link className="post__category" to={listingPath({ category: postMeta.category })}>
                  {categoryLabel(postMeta.category)}
                </Link>
              </li>
            </ul>
          </div>
          <h1 tabIndex={-1}>{postMeta.title}</h1>
          {postMeta.description && (
            <p className="hero-copy post__lede">{postMeta.description}</p>
          )}
          <ArticleActions />
        </header>
        {hasArticleHero && (
          <figure className="post-hero-figure">
            <button
              className="image-expand-trigger image-expand-trigger--hero"
              type="button"
              onClick={(event) =>
                openExpandedImage({
                  src: heroImage.src,
                  alt: heroImage.alt,
                  caption: heroImage.caption,
                }, event.currentTarget)
              }
              aria-label={`Open image: ${heroImage.alt || 'Article illustration'}`}
            >
              <img
                src={heroImage.src}
                {...imageMetadata[heroImage.src]}
                fetchPriority="high"
                alt={heroImage.alt}
                loading="eager"
              />
            </button>
            {heroImage.caption && <figcaption>{heroImage.caption}</figcaption>}
          </figure>
        )}
        <div className="post-content" ref={contentRef}>
          <ExpandImageContext.Provider value={openExpandedImage}>
            <PostContent components={mdxComponents} />
          </ExpandImageContext.Provider>
        </div>
        <ArticleActions showBackToTop />
        {related.length > 0 && (
          <section className="related-notes" aria-labelledby="related-notes-title">
            <h2 id="related-notes-title" className="article-section-title">Related field notes</h2>
            <ul>
              {related.map((post) => (
                <li key={post.slug}>
                  <Link to={`/${post.slug}`}>
                    <span>{categoryLabel(post.category)}</span>
                    <strong>{post.title}</strong>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {(newerPost || olderPost) && (
          <nav className="article-nav" aria-label="Adjacent field notes">
            {olderPost ? (
              <Link className="article-nav-link" to={`/${olderPost.slug}`}>
                <span>Previous field note</span>
                <strong>{olderPost.title}</strong>
              </Link>
            ) : (
              <span className="article-nav-link article-nav-link--empty" />
            )}
            {newerPost ? (
              <Link className="article-nav-link article-nav-link--next" to={`/${newerPost.slug}`}>
                <span>Next field note</span>
                <strong>{newerPost.title}</strong>
              </Link>
            ) : (
              <span className="article-nav-link article-nav-link--empty" />
            )}
          </nav>
        )}
        <NewsletterSignup surface="inline" />
      </article>
      </div>
      {expandedImage && (
        <LightboxDialog image={expandedImage} onClose={closeExpandedImage} />
      )}
    </main>
  )
}
