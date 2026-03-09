import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { FrappeProvider } from 'frappe-react-sdk'
import './styles/index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FrappeProvider>
      <App />
    </FrappeProvider>
  </StrictMode>,
)
