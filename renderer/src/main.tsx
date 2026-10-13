import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyLanguage } from './i18n'
import { initTheme } from './store/theme'
import './index.css'

applyLanguage()
initTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
