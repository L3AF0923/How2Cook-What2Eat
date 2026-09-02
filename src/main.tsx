import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './menu-structure.css'
import './v04.css'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
