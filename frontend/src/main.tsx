import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Styles globaux
import './index.css'
import './App.css'
import './lib/theme.css'
import './components/AppLayout.css'
import './components/Cards.css'
import './components/SVG.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
