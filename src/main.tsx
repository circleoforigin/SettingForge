import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ActivationGate } from './activation/ActivationGate.tsx'

createRoot(document.getElementById('root')!).render(
  <ActivationGate>
    <App />
  </ActivationGate>
)
