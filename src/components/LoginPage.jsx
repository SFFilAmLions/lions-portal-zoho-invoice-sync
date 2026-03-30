import { useState } from 'react'
import { useZohoAuth } from '../hooks/useZohoAuth.js'

const REGIONS = [
  { value: 'com', label: 'Global (US)' },
  { value: 'eu', label: 'Europe' },
  { value: 'in', label: 'India' },
  { value: 'com.au', label: 'Australia' },
  { value: 'jp', label: 'Japan' },
]

export default function LoginPage() {
  const { login } = useZohoAuth()
  const [region, setRegion] = useState('com')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLogin() {
    setLoading(true)
    setError(null)
    try {
      await login(region)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Zoho Invoice</h1>
        <h2 style={styles.subtitle}>Customer Editor</h2>

        <label style={styles.label} htmlFor="region">
          Zoho region
        </label>
        <select
          id="region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={styles.select}
          disabled={loading}
        >
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        {error && <p style={styles.error}>{error}</p>}

        <button style={styles.button} onClick={handleLogin} disabled={loading}>
          {loading ? 'Redirecting…' : 'Connect to Zoho Invoice'}
        </button>
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
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  title: { margin: 0, fontSize: '1.5rem', color: '#e0440e' },
  subtitle: { margin: 0, fontSize: '1rem', color: '#555', fontWeight: 400 },
  label: { fontSize: '0.875rem', color: '#333', fontWeight: 600 },
  select: {
    padding: '0.5rem',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '0.9rem',
  },
  button: {
    marginTop: '0.5rem',
    padding: '0.75rem',
    background: '#e0440e',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 600,
  },
  error: { color: '#c00', fontSize: '0.85rem', margin: 0 },
}
