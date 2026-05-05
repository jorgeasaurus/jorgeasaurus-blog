import { Link } from 'react-router-dom'
import { formatDate, type PostMeta } from '../lib/posts'
import useLiquidGlassSurface from '../hooks/useLiquidGlassSurface'

interface PostCardProps {
  post: PostMeta
  featured?: boolean
}

export default function PostCard({ post, featured = false }: PostCardProps) {
  const glassRef = useLiquidGlassSurface<HTMLAnchorElement>({
    borderRadius: featured ? 34 : 24,
    type: 'rounded',
  })

  return (
    <Link
      to={`/${post.slug}`}
      className={`post-card glass-panel ${featured ? 'post-card--featured' : ''}`}
      aria-label={`Read ${post.title}`}
      ref={glassRef}
    >
      <div className="post-card-meta">
        {featured && <span>Latest</span>}
        <p className="post-card-date">{formatDate(post.date)}</p>
      </div>
      <h2 className="post-card-title">{post.title}</h2>
      <p className="post-card-desc">{post.description}</p>
      {post.tags && post.tags.length > 0 && (
        <div className="post-card-tags" aria-label="Tags">
          {post.tags.slice(0, 4).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}
      <span className="post-card-cta" aria-hidden="true">
        Read field note
        <span>→</span>
      </span>
    </Link>
  )
}
