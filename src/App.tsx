import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Post from './pages/Post.tsx'
import About from './pages/About.tsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/post/:slug" element={<Post />} />
        <Route path="/about" element={<About />} />
        <Route path="/:slug" element={<Post />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
