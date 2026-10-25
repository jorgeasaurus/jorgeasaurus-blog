import { Link } from 'react-router-dom'
import { formatDate, sortPostsByDate, type PostMeta } from '../lib/posts'
import { categories, categoryLabel, listingPath } from '../lib/postSearch.mjs'
import { readingMinutes } from '../lib/readingTime'

export default function Dashboard({ posts }: { posts: PostMeta[] }) {
  const sorted = sortPostsByDate(posts)
  const latest = sorted[0]
  const counts = categories.map((category) => ({
    ...category,
    count: posts.filter((post) => post.category === category.slug).length,
  }))

  if (!latest) return null

  return (
    <section className="ac-dashboard" id="overview" aria-label="Overview">
      <article className="ac-tile">
        <h2>Latest post</h2>
        <p className="ac-tile-kicker">{categoryLabel(latest.category)}</p>
        <Link to={`/${latest.slug}`} aria-label={`Latest post: ${latest.title}`}>
          {latest.title}
        </Link>
        <p className="ac-tile-meta">
          <time dateTime={latest.date}>{formatDate(latest.date)}</time>
          {readingMinutes(latest.slug) > 0 && <span>{readingMinutes(latest.slug)} min read</span>}
        </p>
      </article>
      <article className="ac-tile">
        <h2>Posts by category</h2>
        <ul className="ac-count-list">
          {counts.map((category) => (
            <li key={category.slug}>
              <Link to={listingPath({ category: category.slug })}>
                <span>{category.label}</span>
                <span className="ac-count">{category.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </article>
      <article className="ac-tile">
        <h2>Essentials</h2>
        <dl className="ac-facts">
          <div>
            <dt>Author</dt>
            <dd>Jorge Suarez</dd>
          </div>
          <div>
            <dt>Focus</dt>
            <dd>PowerShell, Intune, and endpoint automation</dd>
          </div>
          <div>
            <dt>Published notes</dt>
            <dd>{posts.length}</dd>
          </div>
        </dl>
        <Link className="ac-tile-action" to="/about">Open profile</Link>
      </article>
    </section>
  )
}
