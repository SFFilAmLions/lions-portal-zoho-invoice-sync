/**
 * Zoho Invoice API helpers.
 *
 * Region suffixes: com | eu | in | com.au | jp
 * Australia uses "com.au" — not "au".
 */

export const BASE_ACCOUNTS = (region) =>
  `https://accounts.zoho.${region}`

// invoice.zoho.com does not support CORS for browser requests.
// www.zohoapis.com is the CORS-enabled endpoint for client-based apps.
export const BASE_INVOICE = (region) =>
  `https://www.zohoapis.${region}/invoice/v3`

/**
 * Exchange an authorization code for an access token.
 * Client-based applications have no client_secret.
 */
export async function exchangeCodeForToken({ code, codeVerifier, clientId, redirectUri, region }) {
  const url = `${BASE_ACCOUNTS(region)}/oauth/v2/token`
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier,
  })

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${text}`)
  }

  return res.json()
}

/**
 * Fetch the list of organizations the token has access to.
 * Requires ZohoInvoice.settings.READ scope.
 */
export async function fetchOrganizations(accessToken, region) {
  const url = `${BASE_INVOICE(region)}/organizations`
  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`fetchOrganizations failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.organizations ?? []
}

/**
 * Fetch a paginated list of contacts (customers).
 */
export async function fetchContacts(accessToken, orgId, region, { page = 1, perPage = 25 } = {}) {
  const url = new URL(`${BASE_INVOICE(region)}/contacts`)
  url.searchParams.set('organization_id', orgId)
  url.searchParams.set('page', page)
  url.searchParams.set('per_page', perPage)
  url.searchParams.set('contact_type', 'customer')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`fetchContacts failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return { contacts: data.contacts ?? [], page_context: data.page_context ?? {} }
}

/**
 * Update a single contact via PUT.
 * Zoho requires the full contact payload — partial updates are not supported.
 */
export async function updateContact(accessToken, orgId, region, contactId, payload) {
  const url = `${BASE_INVOICE(region)}/contacts/${contactId}?organization_id=${orgId}`

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`updateContact(${contactId}) failed (${res.status}): ${text}`)
  }

  return res.json()
}
