import { Link } from 'react-router-dom'
import { formatDate, type PostMeta } from '../lib/posts'

interface PostCardProps {
  post: PostMeta
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link to={`/${post.slug}`} className="post-card glass-panel">
      <p className="post-card-date">{formatDate(post.date)}</p>
      <h2 className="post-card-title">{post.title}</h2>
      <p className="post-card-desc">{post.description}</p>
      {post.tags && post.tags.length > 0 && (
        <div className="post-card-tags" aria-label="Tags">
          {post.tags.slice(0, 4).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      )}
    </Link>
  )
}
