import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './v2.css'

history.scrollRestoration = 'manual'
createRoot(document.getElementById('root')).render(<App />)
