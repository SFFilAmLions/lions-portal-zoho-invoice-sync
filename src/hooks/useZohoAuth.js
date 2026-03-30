import { useState, useEffect, useCallback } from 'react'
import { generateCodeVerifier, generateCodeChallenge } from '../lib/pkce.js'
import { BASE_ACCOUNTS, exchangeCodeForToken, fetchOrganizations } from '../lib/zohoApi.js'

const SESSION_KEY = 'zoho_session'
const VERIFIER_KEY = 'zoho_pkce_verifier'

const SCOPES = [
  'ZohoInvoice.contacts.READ',
  'ZohoInvoice.contacts.UPDATE',
  'ZohoInvoice.settings.READ',
].join(',')

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

  const login = useCallback(async (region = 'com') => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    sessionStorage.setItem(VERIFIER_KEY, JSON.stringify({ verifier, region }))

    const clientId = import.meta.env.VITE_ZOHO_CLIENT_ID
    const redirectUri = import.meta.env.VITE_ZOHO_REDIRECT_URI

    const authUrl = new URL(`${BASE_ACCOUNTS(region)}/oauth/v2/auth`)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('scope', SCOPES)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('access_type', 'online')
    authUrl.searchParams.set('code_challenge', challenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')

    window.location.href = authUrl.toString()
  }, [])

  const handleCallback = useCallback(async (code) => {
    const raw = sessionStorage.getItem(VERIFIER_KEY)
    if (!raw) throw new Error('No PKCE verifier found in sessionStorage')
    const { verifier, region } = JSON.parse(raw)

    const clientId = import.meta.env.VITE_ZOHO_CLIENT_ID
    const redirectUri = import.meta.env.VITE_ZOHO_REDIRECT_URI

    const tokenData = await exchangeCodeForToken({
      code,
      codeVerifier: verifier,
      clientId,
      redirectUri,
      region,
    })

    if (tokenData.error) {
      throw new Error(`OAuth error: ${tokenData.error} – ${tokenData.error_description ?? ''}`)
    }

    const orgs = await fetchOrganizations(tokenData.access_token, region)
    if (!orgs.length) throw new Error('No Zoho Invoice organizations found for this account.')

    const newSession = {
      accessToken: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in ?? 3600) * 1000,
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
