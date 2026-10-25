import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import Home from './pages/Home.tsx'
import Post from './pages/Post.tsx'
import About from './pages/About.tsx'
import Projects from './pages/Projects.tsx'
import SocialCard from './pages/SocialCard.tsx'
import NotFound from './pages/NotFound.tsx'
import AdminHome from './admin/views/AdminHome.tsx'
import AdminPost from './admin/views/AdminPost.tsx'
import AdminAbout from './admin/views/AdminAbout.tsx'
import AdminProjects from './admin/views/AdminProjects.tsx'
import AdminNotFound from './admin/views/AdminNotFound.tsx'
import { ThemeProvider } from './theme/ThemeProvider.tsx'
import { useTheme } from './theme/themeContext.ts'

function ThemedPage({ classic, admin }: { classic: ReactNode; admin: ReactNode }) {
  const { theme } = useTheme()
  return theme === 'admin' ? admin : classic
}

function App() {
  return (
    <>
      <BrowserRouter>
        <ThemeProvider>
          <Routes>
            <Route path="/" element={<ThemedPage classic={<Home />} admin={<AdminHome />} />} />
            <Route path="/social-card" element={<SocialCard />} />
            <Route path="/post/:slug" element={<ThemedPage classic={<Post />} admin={<AdminPost />} />} />
            <Route path="/about" element={<ThemedPage classic={<About />} admin={<AdminAbout />} />} />
            <Route path="/projects" element={<ThemedPage classic={<Projects />} admin={<AdminProjects />} />} />
            <Route
              path="/untitled"
              element={
                <Navigate
                  to="/intune-device-queries-to-level-up-your-device-management"
                  replace
                />
              }
            />
            <Route path="/:slug" element={<ThemedPage classic={<Post />} admin={<AdminPost />} />} />
            <Route path="*" element={<ThemedPage classic={<NotFound />} admin={<AdminNotFound />} />} />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
      <Analytics />
    </>
  )
}

export default App
