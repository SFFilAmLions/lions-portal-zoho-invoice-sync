import { Routes, Route, Navigate } from 'react-router-dom'
import { useZohoAuth } from './hooks/useZohoAuth.js'
import LoginPage from './components/LoginPage.jsx'
import OAuthCallback from './components/OAuthCallback.jsx'
import CustomerTable from './components/CustomerTable.jsx'

/**
 * Root route: detects OAuth callback via window.location.search (NOT
 * useLocation().search) because Zoho redirects to /?code=ABC#/ — the
 * query string appears before the hash, making it invisible to React Router.
 */
function RootRoute() {
  const { isAuthenticated } = useZohoAuth()
  const hasCode = new URLSearchParams(window.location.search).has('code')

  if (hasCode) return <OAuthCallback />
  if (isAuthenticated) return <CustomerTable />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<RootRoute />} />
    </Routes>
  )
}
