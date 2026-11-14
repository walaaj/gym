import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import AuthGate from './auth/AuthGate.jsx'
import { oidcConfig } from './auth/oidcConfig.js'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <AuthGate />
    </AuthProvider>
  </StrictMode>,
)
