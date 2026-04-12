import React from 'react'
import ReactDOM from 'react-dom/client'
import { initConsoleCapture } from '@/lib/consoleCapture'

initConsoleCapture()
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)