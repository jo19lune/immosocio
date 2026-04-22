import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

// Styles globaux
import './styles/base/index.css'
import './styles/base/App.css'
import './styles/base/theme.css'
import './styles/components/Cards.css'
import './styles/components/SVG.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
