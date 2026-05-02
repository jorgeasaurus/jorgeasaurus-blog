import { Link } from 'react-router-dom'
import { formatDate, type PostMeta } from '../lib/posts'

interface PostCardProps {
  post: PostMeta
}

export default function PostCard({ post }: PostCardProps) {
  return (
    <Link to={`/post/${post.slug}`} className="post-card">
      <p className="post-card-date">{formatDate(post.date)}</p>
      <h2 className="post-card-title">{post.title}</h2>
      <p className="post-card-desc">{post.description}</p>
    </Link>
  )
}
