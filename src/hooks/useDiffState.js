import { useMemo, useState } from 'react'

const DIFF_FIELDS = [
  { key: 'email', label: 'Email', zohoPath: (c) => c.email },
  {
    key: 'mobile',
    label: 'Mobile',
    zohoPath: (c) => c.mobile,
    normalize: normPhone,
  },
  {
    key: 'address',
    label: 'Street',
    zohoPath: (c) => c.billing_address?.address,
  },
  {
    key: 'billing_city',
    label: 'City',
    zohoPath: (c) => c.billing_address?.city,
  },
  {
    key: 'billing_state',
    label: 'State',
    zohoPath: (c) => c.billing_address?.state,
  },
  {
    key: 'billing_zip',
    label: 'Zip',
    zohoPath: (c) => c.billing_address?.zip,
    normalize: normZip,
  },
  {
    key: 'billing_country',
    label: 'Country',
    zohoPath: (c) => c.billing_address?.country,
  },
  {
    key: 'cf_member_type',
    label: 'Member Type',
    zohoPath: (c) =>
      c.custom_fields?.find((f) => f.api_name === 'cf_member_type')?.value,
  },
]

function norm(val) {
  return (val ?? '').toString().trim().toLowerCase()
}

function normPhone(val) {
  const digits = (val ?? '').replace(/\D/g, '')
  return digits.length === 11 && digits[0] === '1' ? digits.slice(1) : digits
}

function normZip(val) {
  return (val ?? '').trim().replace(/^(\d{5})[- ]?\d*$/, '$1')
}

function matchContact(csvRow, zohoContacts) {
  if (csvRow.cf_member_id) {
    const byId = zohoContacts.find((c) =>
      c.custom_fields?.some(
        (f) =>
          f.api_name === 'cf_member_id' &&
          norm(f.value) === norm(csvRow.cf_member_id)
      )
    )
    if (byId) return byId
  }
  return (
    zohoContacts.find(
      (c) =>
        norm(c.first_name) === norm(csvRow.first_name) &&
        norm(c.last_name) === norm(csvRow.last_name)
    ) ?? null
  )
}

function computeDiffs(csvRow, contact) {
  return DIFF_FIELDS.flatMap(({ key, label, zohoPath, normalize = norm }) => {
    const csvValue = (csvRow[key] ?? '').toString().trim()
    const zohoValue = (zohoPath(contact) ?? '').toString().trim()
    if (!csvValue) return [] // don't offer to blank out existing Zoho data
    if (normalize(csvValue) === normalize(zohoValue)) return []
    return [
      {
        id: `${contact.contact_id}__${key}`,
        field: label,
        fieldKey: key,
        csvValue,
        zohoValue,
        contactId: contact.contact_id,
      },
    ]
  })
}

export function useDiffState(membersData, zohoContacts) {
  const [approvals, setApprovals] = useState({}) // { diffId: 'approved' | 'skipped' }
  const [selectedUnmatched, setSelectedUnmatched] = useState(new Set())

  const { matched, unmatched, upToDate } = useMemo(() => {
    if (!membersData?.rows?.length || !zohoContacts?.length) {
      return { matched: [], unmatched: [], upToDate: [] }
    }
    const _matched = [],
      _unmatched = [],
      _upToDate = []
    for (const csvRow of membersData.rows) {
      const contact = matchContact(csvRow, zohoContacts)
      if (!contact) {
        _unmatched.push(csvRow)
        continue
      }
      const diffs = computeDiffs(csvRow, contact)
      if (diffs.length === 0) _upToDate.push({ csvRow, contact })
      else _matched.push({ csvRow, contact, diffs })
    }
    return { matched: _matched, unmatched: _unmatched, upToDate: _upToDate }
  }, [membersData, zohoContacts])

  const approveDiff = (diffId) =>
    setApprovals((prev) => ({ ...prev, [diffId]: 'approved' }))

  const skipDiff = (diffId) =>
    setApprovals((prev) => ({ ...prev, [diffId]: 'skipped' }))

  const approveAll = () => {
    const next = {}
    for (const { diffs } of matched) {
      for (const diff of diffs) next[diff.id] = 'approved'
    }
    setApprovals(next)
  }

  const toggleUnmatched = (memberId) => {
    setSelectedUnmatched((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  const matchedWithApproval = matched.map(({ csvRow, contact, diffs }) => ({
    csvRow,
    contact,
    diffs: diffs.map((d) => ({ ...d, approved: approvals[d.id] ?? null })),
  }))

  const approvedDiffs = matched.flatMap(({ diffs, contact }) =>
    diffs
      .filter((d) => approvals[d.id] === 'approved')
      .map((d) => ({ ...d, contact }))
  )

  return {
    matched: matchedWithApproval,
    unmatched,
    upToDate,
    approveAll,
    approveDiff,
    skipDiff,
    approvedDiffs,
    selectedUnmatched,
    toggleUnmatched,
  }
}
