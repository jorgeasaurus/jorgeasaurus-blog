import Topbar from "../components/Topbar";
import PostCard from "../components/PostCard";
import WallpaperStage from "../components/WallpaperStage";
import { sortPostsByDate } from "../lib/posts";
import posts from "../content/posts";

export default function Home() {
  const sorted = sortPostsByDate(posts);

  return (
    <main className="blog-shell">
      <WallpaperStage />
        <Topbar />
        <section className="hero-panel glass-panel" style={{ gridArea: "hero" }}>
        <div>
          <h1>&gt; Jorgeasaurus</h1>
        </div>
        <div className="hero-footnotes">
          <div>
            <p className="hero-copy">
              Thoughts on PowerShell, automation, engineering, and building
              things that matter.
            </p>
          </div>
        </div>
      </section>
      <section className="content-area" style={{ gridArea: "content" }}>
        <div className="post-list">
          {sorted.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </main>
  );
}
