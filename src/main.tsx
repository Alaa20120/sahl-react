import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Theme } from '@radix-ui/themes'
import './styles/global.css'
import App from './App.tsx'

// Wipe all persisted app data on every load for a completely fresh start
if (typeof window !== 'undefined') {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('sahl-')) localStorage.removeItem(key)
    }
  } catch { /* ignore */ }
}

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
