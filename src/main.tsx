import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './vendor/liquid-glass-js/glass.css'
import './styles/App.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(<App />)
