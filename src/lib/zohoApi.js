/**
 * Zoho Invoice API helpers.
 *
 * Region suffixes: com | eu | in | com.au | jp
 * Australia uses "com.au" — not "au".
 *
 * Zoho Invoice does not support browser CORS. All /invoice/v3 calls are routed
 * through a Cloudflare Worker proxy (VITE_ZOHO_PROXY_URL) that adds the
 * required CORS headers.  The proxy path is /proxy/{region}/...
 */

export const BASE_ACCOUNTS = (region) => `https://accounts.zoho.${region}`

const PROXY_URL = import.meta.env.VITE_ZOHO_PROXY_URL

// Route through the CORS proxy when configured; fall back to direct for local
// dev without a deployed worker.
export const BASE_INVOICE = (region) =>
  PROXY_URL
    ? `${PROXY_URL}/proxy/${region}`
    : `https://www.zohoapis.${region}/invoice/v3`

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
export async function fetchContacts(
  accessToken,
  orgId,
  region,
  { page = 1, perPage = 25 } = {}
) {
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
  return {
    contacts: data.contacts ?? [],
    page_context: data.page_context ?? {},
  }
}

/**
 * Fetch contact persons for a given contact.
 */
export async function fetchContactPersons(
  accessToken,
  orgId,
  region,
  contactId
) {
  const url = `${BASE_INVOICE(region)}/contacts/${contactId}/contactpersons?organization_id=${orgId}`

  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`fetchContactPersons failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  return data.contact_persons ?? []
}

/**
 * Update a contact person via PUT.
 */
export async function updateContactPerson(
  accessToken,
  orgId,
  region,
  contactId,
  personId,
  payload
) {
  const url = `${BASE_INVOICE(region)}/contacts/${contactId}/contactpersons/${personId}?organization_id=${orgId}`

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
    throw new Error(
      `updateContactPerson(${personId}) failed (${res.status}): ${text}`
    )
  }

  return res.json()
}

/**
 * Create a new contact person via POST.
 */
export async function createContactPerson(
  accessToken,
  orgId,
  region,
  contactId,
  payload
) {
  const url = `${BASE_INVOICE(region)}/contacts/${contactId}/contactpersons?organization_id=${orgId}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`createContactPerson failed (${res.status}): ${text}`)
  }

  return res.json()
}

/**
 * Delete a contact person.
 */
export async function deleteContactPerson(
  accessToken,
  orgId,
  region,
  contactId,
  personId
) {
  const url = `${BASE_INVOICE(region)}/contacts/${contactId}/contactpersons/${personId}?organization_id=${orgId}`

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(
      `deleteContactPerson(${personId}) failed (${res.status}): ${text}`
    )
  }

  return res.json()
}

/**
 * Update a single contact via PUT.
 * Zoho requires the full contact payload — partial updates are not supported.
 */
export async function updateContact(
  accessToken,
  orgId,
  region,
  contactId,
  payload
) {
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
    throw new Error(
      `updateContact(${contactId}) failed (${res.status}): ${text}`
    )
  }

  return res.json()
}
