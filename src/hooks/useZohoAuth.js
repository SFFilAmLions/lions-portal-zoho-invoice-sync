import { useState, useEffect, useCallback } from 'react'
import { BASE_ACCOUNTS, fetchOrganizations } from '../lib/zohoApi.js'

const SESSION_KEY = 'zoho_session'
const VERIFIER_KEY = 'zoho_pkce_verifier'

const SCOPES = [
  'ZohoInvoice.contacts.READ',
  'ZohoInvoice.contacts.UPDATE',
  'ZohoInvoice.settings.READ',
].join(' ')

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
  sessionStorage.removeItem(VERIFIER_KEY)
}

export function useZohoAuth() {
  const [session, setSession] = useState(() => loadSession())

  // Auto-logout when token expires
  useEffect(() => {
    if (!session) return
    if (Date.now() >= session.expiresAt) {
      clearSession()
      setSession(null)
      return
    }
    const ms = session.expiresAt - Date.now()
    const t = setTimeout(() => {
      clearSession()
      setSession(null)
    }, ms)
    return () => clearTimeout(t)
  }, [session])

  const login = useCallback((region = 'com') => {
    sessionStorage.setItem(VERIFIER_KEY, JSON.stringify({ region }))

    const clientId = import.meta.env.VITE_ZOHO_CLIENT_ID
    const redirectUri = import.meta.env.VITE_ZOHO_REDIRECT_URI

    const authUrl = new URL(`${BASE_ACCOUNTS(region)}/oauth/v2/auth`)
    authUrl.searchParams.set('response_type', 'token')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('scope', SCOPES)
    authUrl.searchParams.set('redirect_uri', redirectUri)

    window.location.href = authUrl.toString()
  }, [])

  const handleCallback = useCallback(async ({ access_token, expires_in }) => {
    const raw = sessionStorage.getItem(VERIFIER_KEY)
    const { region } = raw ? JSON.parse(raw) : { region: 'com' }

    const orgs = await fetchOrganizations(access_token, region)
    if (!orgs.length) throw new Error('No Zoho Invoice organizations found for this account.')

    const newSession = {
      accessToken: access_token,
      expiresAt: Date.now() + (parseInt(expires_in) || 3600) * 1000,
      region,
      orgId: orgs[0].organization_id,
      orgs,
    }

    saveSession(newSession)
    setSession(newSession)
    sessionStorage.removeItem(VERIFIER_KEY)

    return newSession
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  return {
    isAuthenticated: !!session && Date.now() < (session?.expiresAt ?? 0),
    accessToken: session?.accessToken ?? null,
    region: session?.region ?? null,
    orgId: session?.orgId ?? null,
    orgs: session?.orgs ?? [],
    login,
    handleCallback,
    logout,
  }
}
