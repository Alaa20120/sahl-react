import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Theme } from '@radix-ui/themes'
import './styles/global.css'
import App from './App.tsx'

// Handle SPA redirect (from 404.html)
const savedRoute = sessionStorage.getItem('gh-pages-route')
if (savedRoute) {
  sessionStorage.removeItem('gh-pages-route')
  window.history.replaceState(null, '', '/' + savedRoute)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme>
      <App />
    </Theme>
  </StrictMode>,
)
