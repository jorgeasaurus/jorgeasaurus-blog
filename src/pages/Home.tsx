import Topbar from '../components/Topbar'
import PostCard from '../components/PostCard'
import { sortPostsByDate, type PostMeta } from '../lib/posts'

const posts: PostMeta[] = [
  {
    slug: 'hello-world',
    title: 'Hello, World',
    date: '2026-05-01',
    description: 'Welcome to my new blog. Built with React, Vite, and MDX.',
  },
]

export default function Home() {
  const sorted = sortPostsByDate(posts)

  return (
    <main className="blog-shell">
      <Topbar />
      <div className="hero-panel glass-panel" style={{ gridArea: 'hero' }}>
        <div>
          <p className="eyebrow">Blog</p>
          <h1>Jorge Asaurus</h1>
          <p className="hero-copy">
            Thoughts on PowerShell, automation, engineering, and building things
            that matter.
          </p>
        </div>
      </div>
      <div style={{ gridArea: 'content' }}>
        <div className="post-list">
          {sorted.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </div>
    </main>
  )
}
