import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'

interface PostData {
  title: string
  date: string
  description: string
  default: React.ComponentType
}

export default function Post() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<PostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadPost() {
      try {
        const module = (await import(`../content/${slug}.mdx`)) as PostData
        setPost(module)
      } catch {
        setError('Post not found')
      } finally {
        setLoading(false)
      }
    }
    loadPost()
  }, [slug])

  if (loading) {
    return (
      <main className="blog-shell">
        <Topbar />
        <div style={{ gridArea: 'content' }}>
          <div className="glass-panel">
            <div className="loading-inline">
              <div className="spinner" />
              Loading...
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !post) {
    return (
      <main className="blog-shell">
        <Topbar />
        <div style={{ gridArea: 'content' }}>
          <div className="glass-panel">
            <h1>Post Not Found</h1>
            <p className="hero-copy">
              The post you're looking for doesn't exist.
            </p>
          </div>
        </div>
      </main>
    )
  }

  const PostContent = post.default

  return (
    <main className="blog-shell">
      <Topbar />
      <div style={{ gridArea: 'content' }}>
        <article className="glass-panel">
          <header>
            <p className="post-card-date">{post.date}</p>
            <h1>{post.title}</h1>
            {post.description && (
              <p className="hero-copy">{post.description}</p>
            )}
          </header>
          <div className="post-content">
            <PostContent />
          </div>
        </article>
      </div>
    </main>
  )
}
