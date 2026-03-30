/**
 * PKCE helpers for OAuth 2.0 Authorization Code + PKCE flow.
 * Uses Web Crypto API — available in all modern browsers and on HTTPS.
 */

function base64urlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function generateCodeVerifier() {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return base64urlEncode(bytes)
}

export async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64urlEncode(digest)
}
