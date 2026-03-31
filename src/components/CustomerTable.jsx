import { useState, useCallback, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { useZohoAuth } from '../hooks/useZohoAuth.js'
import { useCustomers, useUpdateContact } from '../hooks/useCustomers.js'
import EditableCell from './EditableCell.jsx'

const PER_PAGE = 25

/**
 * Build the full contact payload for a Zoho PUT request.
 * Zoho does not support partial updates, so we must send the full object.
 */
function buildPayload(original, dirtyFields) {
  const payload = {
    contact_name: original.contact_name,
    email: original.email ?? '',
    phone: original.phone ?? '',
    billing_address: {
      ...(original.billing_address ?? {}),
    },
    custom_fields: [...(original.custom_fields ?? [])],
  }

  for (const [field, value] of Object.entries(dirtyFields)) {
    if (field === 'address') {
      payload.billing_address.address = value
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

export default function CustomerTable() {
  const { logout, orgs, orgId } = useZohoAuth()
  const [page, setPage] = useState(1)
  const { data, isLoading, isFetching, isError, error } = useCustomers({
    page,
    perPage: PER_PAGE,
  })
  const { mutateAsync: saveContact } = useUpdateContact()

  // dirtyMap: { [contactId]: { [columnId]: newValue } }
  const [dirtyMap, setDirtyMap] = useState({})

  const markDirty = useCallback((contactId, columnId, value) => {
    setDirtyMap((prev) => ({
      ...prev,
      [contactId]: { ...(prev[contactId] ?? {}), [columnId]: value },
    }))
  }, [])

  const isDirty = useCallback(
    (contactId, columnId) => dirtyMap[contactId]?.[columnId] !== undefined,
    [dirtyMap]
  )

  const dirtyCount = useMemo(
    () =>
      Object.values(dirtyMap).reduce(
        (acc, fields) => acc + Object.keys(fields).length,
        0
      ),
    [dirtyMap]
  )

  const contacts = data?.contacts ?? []
  const pageContext = data?.page_context ?? {}

  // Build columns dynamically, adding any custom fields from the first contact
  const customFieldColumns = useMemo(() => {
    const first = contacts[0]
    if (!first?.custom_fields) return []
    return first.custom_fields.map((cf) => ({
      accessorFn: (row) =>
        row.custom_fields?.find((f) => f.api_name === cf.api_name)?.value ?? '',
      id: cf.api_name,
      header: cf.label ?? cf.api_name,
      cell: EditableCell,
    }))
  }, [contacts])

  const columns = useMemo(
    () => [
      {
        accessorKey: 'contact_name',
        header: 'Name',
        cell: EditableCell,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: EditableCell,
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: EditableCell,
      },
      {
        accessorFn: (row) => row.billing_address?.address ?? '',
        id: 'address',
        header: 'Billing Address',
        cell: EditableCell,
      },
      ...customFieldColumns,
    ],
    [customFieldColumns]
  )

  const table = useReactTable({
    data: contacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.contact_id,
    meta: { markDirty, isDirty },
  })

  async function saveAll() {
    const entries = Object.entries(dirtyMap)
    if (!entries.length) return

    const results = await Promise.allSettled(
      entries.map(([contactId, dirtyFields]) => {
        const original = contacts.find((c) => c.contact_id === contactId)
        if (!original) return Promise.resolve()
        return saveContact({
          contactId,
          payload: buildPayload(original, dirtyFields),
        })
      })
    )

    // Clear only successful saves from dirtyMap
    setDirtyMap((prev) => {
      const next = { ...prev }
      entries.forEach(([contactId], i) => {
        if (results[i].status === 'fulfilled') delete next[contactId]
      })
      return next
    })

    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length) {
      alert(
        `${failed.length} save(s) failed:\n${failed.map((f) => f.reason?.message).join('\n')}`
      )
    }
  }

  const orgName = orgs.find((o) => o.organization_id === orgId)?.name ?? orgId

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Customers</h1>
          <span style={styles.org}>{orgName}</span>
        </div>
        <div style={styles.actions}>
          {dirtyCount > 0 && (
            <>
              <span style={styles.dirtyBadge}>
                {dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}
              </span>
              <button
                style={styles.btnSecondary}
                onClick={() => setDirtyMap({})}
              >
                Discard
              </button>
              <button
                style={styles.btnPrimary}
                onClick={saveAll}
                disabled={isFetching}
              >
                Save All
              </button>
            </>
          )}
          <button style={styles.btnLogout} onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {isError && <p style={styles.error}>Error: {error?.message}</p>}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th key={header.id} style={styles.th}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} style={styles.center}>
                  Loading…
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} style={styles.tr}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={styles.td}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={styles.pagination}>
        <button
          style={styles.btnPage}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || isFetching}
        >
          ← Prev
        </button>
        <span style={styles.pageInfo}>Page {page}</span>
        <button
          style={styles.btnPage}
          onClick={() => setPage((p) => p + 1)}
          disabled={!pageContext.has_more_page || isFetching}
        >
          Next →
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    fontFamily: 'system-ui, sans-serif',
    padding: '1.5rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  title: { margin: 0, fontSize: '1.5rem', color: '#111' },
  org: { fontSize: '0.85rem', color: '#666' },
  actions: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  dirtyBadge: {
    fontSize: '0.8rem',
    background: '#fef3c7',
    color: '#92400e',
    padding: '3px 8px',
    borderRadius: '9999px',
    fontWeight: 600,
  },
  btnPrimary: {
    padding: '0.45rem 1rem',
    background: '#e0440e',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 600,
  },
  btnSecondary: {
    padding: '0.45rem 1rem',
    background: '#e5e7eb',
    color: '#374151',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  btnLogout: {
    padding: '0.45rem 1rem',
    background: 'transparent',
    color: '#6b7280',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  btnPage: {
    padding: '0.4rem 0.9rem',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  th: {
    textAlign: 'left',
    padding: '8px 10px',
    background: '#f9fafb',
    borderBottom: '2px solid #e5e7eb',
    fontWeight: 600,
    color: '#374151',
    whiteSpace: 'nowrap',
  },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '4px 6px', verticalAlign: 'middle' },
  center: { padding: '2rem', textAlign: 'center', color: '#888' },
  pagination: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
    marginTop: '1rem',
  },
  pageInfo: { fontSize: '0.875rem', color: '#555' },
  error: {
    color: '#c00',
    background: '#fff0f0',
    padding: '0.75rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
}
