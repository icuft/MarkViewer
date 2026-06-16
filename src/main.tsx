import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply saved theme/accent before first paint
try {
  const raw = localStorage.getItem('mdviewer-settings')
  if (raw) {
    const saved = JSON.parse(raw)
    if (saved.theme) document.documentElement.dataset.theme = saved.theme
    if (saved.accentColor) {
      document.documentElement.style.setProperty('--color-accent', saved.accentColor)
    }
  }
} catch {
  /* ignore */
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
