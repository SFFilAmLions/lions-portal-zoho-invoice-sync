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
 * Build a full Zoho contact payload for PUT requests.
 * Zoho does not support PATCH — the full object must be sent.
 *
 * dirtyFields key mapping:
 *   address         → billing_address.address  (street)
 *   billing_city    → billing_address.city
 *   billing_state   → billing_address.state
 *   billing_zip     → billing_address.zip
 *   billing_country → billing_address.country
 *   cf_*            → custom_fields array entry
 *   all others      → top-level contact field
 */
export function buildPayload(original, dirtyFields) {
  const subType =
    dirtyFields.customer_sub_type ?? original.customer_sub_type ?? 'individual'
  const first = dirtyFields.first_name ?? original.first_name ?? ''
  const last = dirtyFields.last_name ?? original.last_name ?? ''
  const companyName =
    dirtyFields.company_name ??
    original.company_name ??
    (original.customer_sub_type === 'business' ? original.contact_name : '')

  const computedName =
    subType === 'business'
      ? companyName || `${first} ${last}`.trim()
      : `${first} ${last}`.trim()

  const payload = {
    contact_name: computedName || original.contact_name || '',
    customer_sub_type: subType,
    company_name: companyName,
    first_name: first,
    last_name: last,
    email: dirtyFields.email ?? original.email ?? '',
    phone: dirtyFields.phone ?? original.phone ?? '',
    mobile: dirtyFields.mobile ?? original.mobile ?? '',
    billing_address: { ...(original.billing_address ?? {}) },
    custom_fields: [...(original.custom_fields ?? [])],
  }

  for (const [field, value] of Object.entries(dirtyFields)) {
    if (
      ['first_name', 'last_name', 'company_name', 'customer_sub_type'].includes(
        field
      )
    ) {
      // already handled above
    } else if (field === 'address') {
      payload.billing_address.address = value
    } else if (field === 'billing_city') {
      payload.billing_address.city = value
    } else if (field === 'billing_state') {
      payload.billing_address.state = value
    } else if (field === 'billing_zip') {
      payload.billing_address.zip = value
    } else if (field === 'billing_country') {
      payload.billing_address.country = value
    } else if (field.startsWith('cf_')) {
      const idx = payload.custom_fields.findIndex((f) => f.api_name === field)
      if (idx >= 0) {
        payload.custom_fields[idx] = { ...payload.custom_fields[idx], value }
      } else {
        payload.custom_fields.push({ api_name: field, value })
      }
    } else {
      payload[field] = value
    }
  }

  return payload
}

/**
 * Fetch all contacts across all pages (for diff matching).
 * Uses perPage=200 to minimize round trips.
 */
export async function fetchAllContacts(accessToken, orgId, region) {
  const all = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    const { contacts, page_context } = await fetchContacts(
      accessToken,
      orgId,
      region,
      {
        page,
        perPage: 200,
      }
    )
    all.push(...contacts)
    hasMore = page_context?.has_more_page ?? false
    page += 1
  }

  return all
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
