import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Home from './pages/Home.tsx'
import Post from './pages/Post.tsx'
import About from './pages/About.tsx'
import SocialCard from './pages/SocialCard.tsx'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/social-card" element={<SocialCard />} />
          <Route path="/post/:slug" element={<Post />} />
          <Route path="/about" element={<About />} />
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
          <Route path="*" element={<Post />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </>
  )
}

export default App
