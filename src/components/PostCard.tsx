import { Link, useSearchParams } from 'react-router-dom'
import { formatDate, type PostMeta } from '../lib/posts'
import { categoryLabel, listingPath } from '../lib/postSearch.mjs'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'

interface PostCardProps {
  post: PostMeta
  featured?: boolean
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  const [searchParams] = useSearchParams()
  const glassRef = useLiquidGlassSurface<HTMLElement>({
    borderRadius: featured ? 34 : 24,
    type: 'rounded',
  })
  const category = searchParams.get('category')
  const keywords = post.tags?.slice(0, 4) ?? []

  return (
    <article
      className={`post-card glass-panel ${featured ? 'post-card--featured' : ''}`}
      ref={glassRef}
    >
      <div className="post-card-body">
        <div className="post-card-meta">
          {featured && <span>Latest</span>}
          <p className="post-card-date">{formatDate(post.date)}</p>
        </div>
        <h3 className="post-card-title">
          <Link to={`/${post.slug}`} className="post-card-link">
            {post.title}
          </Link>
        </h3>
        <p className="post-card-desc">{post.description}</p>
        <ul className="post-card-tags" aria-label="Category and keywords">
          <li>
            <Link to={listingPath({ category: post.category })}>
              {categoryLabel(post.category)}
            </Link>
          </li>
          {keywords.map((keyword) => (
            <li key={keyword}>
              <Link to={listingPath({ category, tag: keyword })}>
                {keyword}
              </Link>
            </li>
          ))}
        </ul>
        <span className="post-card-cta" aria-hidden="true">
          Read field note
          <span>→</span>
        </span>
      </div>
    </article>
  )
}
