import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Inter font weights: 400, 500, 600, 700, 800
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'

// Bill Snap design tokens, layout, and 3D components
import './styles/tokens.css'
import './styles/layout.css'
import './styles/components.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
