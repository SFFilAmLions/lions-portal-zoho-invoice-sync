import { Routes, Route } from 'react-router-dom'
import OAuthCallback from './components/OAuthCallback.jsx'
import WizardShell from './components/WizardShell.jsx'

function RootRoute() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const hasToken = hashParams.has('access_token')
  if (hasToken) return <OAuthCallback />
  return <WizardShell />
}

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<RootRoute />} />
    </Routes>
  )
}
