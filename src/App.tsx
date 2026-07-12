import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Home from './pages/Home.tsx'
import Post from './pages/Post.tsx'
import About from './pages/About.tsx'
import Projects from './pages/Projects.tsx'
import SocialCard from './pages/SocialCard.tsx'
import NotFound from './pages/NotFound.tsx'
import NewsletterPopup from './components/NewsletterPopup.tsx'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/social-card" element={<SocialCard />} />
          <Route path="/post/:slug" element={<Post />} />
          <Route path="/about" element={<About />} />
          <Route path="/projects" element={<Projects />} />
          <Route
            path="/untitled"
            element={
              <Navigate
                to="/intune-device-queries-to-level-up-your-device-management"
                replace
              />
            }
          />
          <Route path="/:slug" element={<Post />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <NewsletterPopup />
      </BrowserRouter>
      <Analytics />
    </>
  )
}

export default App
