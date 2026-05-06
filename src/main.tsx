import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App.tsx'

// Handle GitHub Pages SPA redirect
const savedRoute = sessionStorage.getItem('gh-pages-route')
if (savedRoute) {
  sessionStorage.removeItem('gh-pages-route')
  const base = '/sahl-react/'
  if (window.location.pathname === base || window.location.pathname === base.slice(0, -1)) {
    window.history.replaceState(null, '', base + savedRoute)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
