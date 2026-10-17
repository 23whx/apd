import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { reloadForNewVersion } from './lib/chunkReload'

// Vite fires this when a lazy chunk (or its CSS) fails to preload, typically because a new deploy replaced
// the hashed file names this tab knows about. Reload once to get the new version; if we already did,
// let the error reach RouteErrorBoundary instead of looping.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadForNewVersion()) event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
