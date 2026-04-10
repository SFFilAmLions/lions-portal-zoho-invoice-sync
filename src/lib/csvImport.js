/**
 * CSV import utilities — pure functions, no React dependencies.
 */
import { debugLog } from './debug.js'

/** Standard Zoho contact fields available as mapping targets. */
export const STANDARD_ZOHO_FIELDS = [
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'address', label: 'Billing Address' },
  { value: 'billing_city', label: 'Billing City' },
  { value: 'billing_state', label: 'Billing State' },
  { value: 'billing_zip', label: 'Billing Zip' },
  { value: 'billing_country', label: 'Billing Country' },
]

/**
 * CSV header → Zoho field auto-mapping for the Lions Club report format.
 * Only covers headers that have a clear 1-to-1 mapping.
 */
export const AUTO_MAP = {
  'Contact: First Name': 'first_name',
  'Contact: Last Name': 'last_name',
  'Contact: Personal Email': 'email',
  'Contact: Mobile': 'mobile',
  'Contact: Mailing Address Line 1': 'address',
  'Contact: Mailing City': 'billing_city',
  'Contact: Mailing State/Province': 'billing_state',
  'Contact: Mailing Zip/Postal Code': 'billing_zip',
  'Contact: Mailing Country': 'billing_country',
}

/**
 * CSV headers that are ignored by default (no useful Zoho field equivalent).
 * The user can still map them manually.
 */
export const IGNORE_BY_DEFAULT = new Set([
  'Contact: Preferred Email',
  'Contact: Preferred Phone',
  'Type',
  'Account Id',
  'Parent Id',
  'Parent Parent Id',
  'Parent Multiple District',
  'Parent District',
  'Contact: First Name (Local)',
  'Contact: Last Name (Local)',
  'Contact: Local Address',
  'Account Name (Local)',
])

const MAPPING_STORAGE_KEY = 'csvImport.mapping'
const MATCH_KEY_STORAGE_KEY = 'csvImport.matchKey'

export function loadSavedMapping() {
  try {
    const raw = localStorage.getItem(MAPPING_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveMapping(mapping) {
  try {
    localStorage.setItem(MAPPING_STORAGE_KEY, JSON.stringify(mapping))
  } catch {
    // ignore storage errors
  }
}

export function loadSavedMatchKey() {
  try {
    const raw = localStorage.getItem(MATCH_KEY_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveMatchKey(csvHeader, zohoField) {
  try {
    localStorage.setItem(
      MATCH_KEY_STORAGE_KEY,
      JSON.stringify({ csvHeader, zohoField })
    )
  } catch {
    // ignore storage errors
  }
}

/**
 * Build the initial column mapping for a set of CSV headers.
 * Prefers saved mapping, falls back to AUTO_MAP, then '__ignore__'.
 */
export function initialMapping(headers) {
  const saved = loadSavedMapping() ?? {}
  return Object.fromEntries(
    headers.map((h) => [h, saved[h] ?? AUTO_MAP[h] ?? '__ignore__'])
  )
}

/** Read a Zoho contact's value for a given field id. */
export function getContactFieldValue(contact, fieldId) {
  if (fieldId === 'address') return contact.billing_address?.address ?? ''
  if (fieldId === 'billing_city') return contact.billing_address?.city ?? ''
  if (fieldId === 'billing_state') return contact.billing_address?.state ?? ''
  if (fieldId === 'billing_zip') return contact.billing_address?.zip ?? ''
  if (fieldId === 'billing_country')
    return contact.billing_address?.country ?? ''
  if (fieldId?.startsWith('cf_')) {
    return (
      contact.custom_fields?.find((f) => f.api_name === fieldId)?.value ?? ''
    )
  }
  return contact[fieldId] ?? ''
}

/**
 * Normalize a string for comparison: trim leading/trailing whitespace and
 * collapse internal runs of whitespace to a single space.
 */
function normalizeWs(s) {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Apply a column mapping to parsed CSV rows, producing dirty-map entries.
 *
 * @param {Object[]} csvRows - rows from PapaParse (header: true)
 * @param {Object}   mapping - { [csvHeader]: zohoFieldId | '__ignore__' }
 * @param {string}   matchCsvHeader - CSV column used to identify the contact
 * @param {string}   matchZohoField - Zoho field to compare match value against
 * @param {Object[]} contacts - loaded Zoho contacts
 * @returns {{ dirtyMap: Object, matchedCount: number, unmatchedCount: number }}
 *   dirtyMap: { [contactId]: { [zohoFieldId]: newValue } }
 */
export function applyMapping(
  csvRows,
  mapping,
  matchCsvHeader,
  matchZohoField,
  contacts
) {
  const dirtyMap = {}
  let matchedCount = 0
  let unmatchedCount = 0

  for (const row of csvRows) {
    const matchValue = normalizeWs(row[matchCsvHeader])
    if (!matchValue) continue

    const contact = contacts.find(
      (c) => normalizeWs(getContactFieldValue(c, matchZohoField)) === matchValue
    )

    if (!contact) {
      unmatchedCount++
      continue
    }

    matchedCount++
    const contactId = contact.contact_id
    const fields = {}

    for (const [csvHeader, zohoField] of Object.entries(mapping)) {
      if (zohoField === '__ignore__') continue
      const csvValue = normalizeWs(row[csvHeader])
      const currentValue = normalizeWs(getContactFieldValue(contact, zohoField))
      if (csvValue !== currentValue) {
        debugLog(
          `csv-diff contact=${contact.contact_name} field=${zohoField}`,
          '\n  csv: ',
          JSON.stringify(csvValue),
          '\n  zoho:',
          JSON.stringify(currentValue)
        )
        fields[zohoField] = csvValue
      }
    }

    if (Object.keys(fields).length > 0) {
      dirtyMap[contactId] = { ...(dirtyMap[contactId] ?? {}), ...fields }
    }
  }

  debugLog(
    `csv-import summary: matched=${matchedCount} unmatched=${unmatchedCount}`,
    `contacts with changes=${Object.keys(dirtyMap).length}`
  )
  return { dirtyMap, matchedCount, unmatchedCount }
}
