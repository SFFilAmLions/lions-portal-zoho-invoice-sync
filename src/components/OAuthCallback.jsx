import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useZohoAuth } from '../hooks/useZohoAuth.js'

export default function OAuthCallback() {
  const { handleCallback } = useZohoAuth()
  const navigate = useNavigate()
  const calledRef = useRef(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Guard against React StrictMode double-invocation
    if (calledRef.current) return
    calledRef.current = true

    // Implicit flow: Zoho redirects to redirect_uri#access_token=TOKEN&expires_in=3600
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const accessToken = params.get('access_token')
    const expiresIn = params.get('expires_in')
    const oauthError = params.get('error')

    if (oauthError) {
      setError(`Zoho returned an error: ${oauthError}`)
      return
    }

    if (!accessToken) {
      setError('No access token found in the redirect URL.')
      return
    }

    handleCallback({ access_token: accessToken, expires_in: expiresIn })
      .then(() => {
        // Strip the ?code= from the URL before navigating
        window.history.replaceState({}, '', window.location.pathname + '#/')
        navigate('/', { replace: true })
      })
      .catch((e) => {
        setError(e.message)
      })
  }, [handleCallback, navigate])

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Authentication Failed</h2>
          <p style={styles.error}>{error}</p>
          <button style={styles.button} onClick={() => navigate('/login', { replace: true })}>
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Connecting to Zoho…</h2>
        <p style={styles.sub}>Exchanging authorization code, please wait.</p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    background: '#fff',
    padding: '2.5rem',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0,0,0,.12)',
    width: '340px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  title: { margin: 0, fontSize: '1.25rem', color: '#333' },
  sub: { color: '#666', margin: 0 },
  error: { color: '#c00', margin: 0 },
  button: {
    padding: '0.6rem 1rem',
    background: '#e0440e',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
  },
}
