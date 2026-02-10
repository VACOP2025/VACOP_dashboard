import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import "leaflet/dist/leaflet.css";
import { RobotConnectionProvider } from './state/robotConnection' // <-- ajoute ça

createRoot(document.getElementById('root')!).render(
  <StrictMode>
        <RobotConnectionProvider>
    <App />
    </RobotConnectionProvider>
  </StrictMode>,
)
