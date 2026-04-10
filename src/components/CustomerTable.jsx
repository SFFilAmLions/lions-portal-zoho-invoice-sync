import { useState, useCallback, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Select,
  Stack,
  Table,
  Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useQueryClient } from '@tanstack/react-query'
import { useZohoAuth } from '../hooks/useZohoAuth.jsx'
import { useCustomers, useUpdateContact } from '../hooks/useCustomers.js'
import { useEditState } from '../hooks/useEditState.js'
import {
  updateContactPerson,
  createContactPerson,
  deleteContactPerson,
} from '../lib/zohoApi.js'
import { getContactFieldValue } from '../lib/csvImport.js'
import { debugLog } from '../lib/debug.js'
import EditableCell from './EditableCell.jsx'
import ColumnHeader from './ColumnHeader.jsx'
import CommitModal from './CommitModal.jsx'
import ContactPersonsPanel from './ContactPersonsPanel.jsx'
import CsvImportModal from './CsvImportModal.jsx'

// Human-readable labels for fields that may appear in dirtyMap but don't have
// a matching column header (billing sub-fields from CSV import, etc.)
const EXTRA_FIELD_LABELS = {
  billing_city: 'Billing City',
  billing_state: 'Billing State',
  billing_zip: 'Billing Zip',
  billing_country: 'Billing Country',
  company_name: 'Company',
  customer_sub_type: 'Type',
}

const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100']
const DEFAULT_PAGE_SIZE = '25'

const COOKIE_NAME = 'lions-col-types'

/** Auto-type a custom field based on its Zoho data_type */
function defaultTypeForCustomField(cf) {
  if (cf.data_type === 'dropdown') return 'enum'
  return 'text'
}

// --- Cookie helpers for column type overrides ---

function readColTypesCookie() {
  try {
    const match = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(COOKIE_NAME + '='))
    if (!match) return {}
    return JSON.parse(decodeURIComponent(match.slice(COOKIE_NAME.length + 1)))
  } catch {
    return {}
  }
}

function writeColTypesCookie(overrides) {
  const value = encodeURIComponent(JSON.stringify(overrides))
  // 1-year expiry
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${COOKIE_NAME}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

// ---

function getStoredPageSize() {
  try {
    const stored = localStorage.getItem('customerTable.pageSize')
    return PAGE_SIZE_OPTIONS.includes(stored) ? stored : DEFAULT_PAGE_SIZE
  } catch {
    return DEFAULT_PAGE_SIZE
  }
}

/**
 * Build the full contact payload for a Zoho PUT request.
 * Zoho does not support partial updates, so we must send the full object.
 */
function buildPayload(original, dirtyFields) {
  const subType =
    dirtyFields.customer_sub_type ?? original.customer_sub_type ?? 'individual'
  const first = dirtyFields.first_name ?? original.first_name ?? ''
  const last = dirtyFields.last_name ?? original.last_name ?? ''
  const companyName =
    dirtyFields.company_name ??
    original.company_name ??
    (original.customer_sub_type === 'business' ? original.contact_name : '')

  const payload = {
    contact_name:
      subType === 'business'
        ? companyName || `${first} ${last}`.trim()
        : `${first} ${last}`.trim(),
    customer_sub_type: subType,
    company_name: companyName,
    first_name: first,
    last_name: last,
    email: original.email ?? '',
    phone: original.phone ?? '',
    billing_address: {
      ...(original.billing_address ?? {}),
    },
    custom_fields: [...(original.custom_fields ?? [])],
  }

  for (const [field, value] of Object.entries(dirtyFields)) {
    if (
      field === 'first_name' ||
      field === 'last_name' ||
      field === 'company_name' ||
      field === 'customer_sub_type'
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

/** Serialize the current page of contacts to a CSV string and trigger download. */
function exportContactsToCsv(contacts, customFieldColumns, orgName) {
  const stdHeaders = ['first_name', 'last_name', 'email', 'phone', 'address']
  const cfHeaders = customFieldColumns.map((c) => c.id)
  const allHeaders = [...stdHeaders, ...cfHeaders]

  function escape(v) {
    const s = v == null ? '' : String(v)
    return `"${s.replace(/"/g, '""')}"`
  }

  const rows = contacts.map((c) => [
    escape(c.first_name),
    escape(c.last_name),
    escape(c.email),
    escape(c.phone),
    escape(c.billing_address?.address),
    ...cfHeaders.map((id) =>
      escape(c.custom_fields?.find((f) => f.api_name === id)?.value)
    ),
  ])

  const csv = [allHeaders.map(escape), ...rows]
    .map((r) => r.join(','))
    .join('\r\n')

  const date = new Date().toISOString().split('T')[0]
  const safeName = orgName.replace(/[^a-z0-9]/gi, '_')
  const filename = `customers-${safeName}-${date}.csv`

  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function CustomerTable() {
  const { logout, orgs, orgId, accessToken, region } = useZohoAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(getStoredPageSize)
  const { data, isLoading, isFetching, isError, error } = useCustomers({
    page,
    perPage: Number(pageSize),
  })
  const { mutateAsync: saveContact } = useUpdateContact()

  const {
    dirtyMap,
    setDirtyMap,
    markDirty,
    clearDirty,
    clearRowDirty,
    clearColumnDirty,
    isDirty,
    isRowDirty,
    isColumnDirty,
    getDirtyValue,
    dirtyCount,
    setValidationError,
    clearValidationError,
    hasValidationErrors,
    pendingPersonEdits,
    setPendingPersonEdits,
    pendingPersonAdds,
    setPendingPersonAdds,
    pendingPersonDeletes,
    setPendingPersonDeletes,
    personOpCount,
    markPersonField,
    clearPersonField,
    revertPersonRow,
    addPendingPerson,
    cancelPendingAdd,
    markPersonDelete,
    unmarkPersonDelete,
    clearAll,
    hadStoredEdits,
  } = useEditState(orgId)

  // Edit mode toggle — auto-enter if there were stored edits from a previous session
  const [isEditMode, setIsEditMode] = useState(hadStoredEdits)

  // CommitModal open state
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false)

  // CsvImportModal open state
  const [csvModalOpened, { open: openCsvModal, close: closeCsvModal }] =
    useDisclosure(false)

  // Column type overrides: { [columnId]: type } — seeded from cookie on mount
  const [colTypeOverrides, setColTypeOverrides] = useState(readColTypesCookie)

  // expandedRows: Set of contact_id strings currently expanded
  const [expandedRows, setExpandedRows] = useState(new Set())

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
      meta: { defaultType: defaultTypeForCustomField(cf) },
    }))
  }, [contacts])

  /** Resolve effective type for a column (override wins over default) */
  const getColType = useCallback(
    (columnId, defaultType) =>
      colTypeOverrides[columnId] ?? defaultType ?? 'text',
    [colTypeOverrides]
  )

  /** Handle user changing a column type — persist to cookie */
  const handleTypeChange = useCallback((columnId, newType) => {
    setColTypeOverrides((prev) => {
      const next = { ...prev, [columnId]: newType }
      writeColTypesCookie(next)
      return next
    })
  }, [])

  const toggleExpanded = useCallback((contactId) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(contactId)) {
        next.delete(contactId)
      } else {
        next.add(contactId)
      }
      return next
    })
  }, [])

  const columns = useMemo(
    () => [
      {
        id: 'expander',
        header: '',
        meta: { noTypeSelector: true },
        cell: ({ row, table }) => {
          const meta = table.options.meta ?? {}
          const isEditModeCell = meta.isEditMode ?? false
          const contactId = row.original.contact_id
          const rowDirty = meta.isRowDirty?.(contactId) ?? false
          const cached = queryClient.getQueryData(['contactPersons', row.id])
          // cached takes precedence (accurate after first expand); fall back to
          // the count Zoho returns inline with the contacts list response
          const count = cached?.length ?? row.original.contact_persons?.length
          return (
            <Group gap={2} wrap="nowrap" align="center">
              {isEditModeCell && rowDirty && (
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="orange"
                  onClick={() => meta.clearRowDirty?.(contactId)}
                  title="Revert all changes in this row"
                  aria-label="Revert row"
                >
                  ↩
                </ActionIcon>
              )}
              <button
                onClick={() => toggleExpanded(row.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  padding: '0 4px',
                  color: '#666',
                  whiteSpace: 'nowrap',
                }}
                aria-label={expandedRows.has(row.id) ? 'Collapse' : 'Expand'}
              >
                {expandedRows.has(row.id) ? '▼' : '▶'}
                {count !== undefined && (
                  <span style={{ marginLeft: 3 }}>{count}</span>
                )}
              </button>
            </Group>
          )
        },
      },
      {
        accessorFn: (row) => row.customer_sub_type ?? 'individual',
        id: 'customer_sub_type',
        header: 'Type',
        cell: EditableCell,
        meta: { defaultType: 'enum', noTypeSelector: true },
      },
      {
        accessorKey: 'first_name',
        header: 'First Name',
        cell: EditableCell,
        meta: { defaultType: 'text' },
      },
      {
        accessorKey: 'last_name',
        header: 'Last Name',
        cell: EditableCell,
        meta: { defaultType: 'text' },
      },
      {
        accessorFn: (row) =>
          row.company_name ??
          (row.customer_sub_type === 'business' ? row.contact_name : ''),
        id: 'company_name',
        header: 'Company',
        cell: EditableCell,
        meta: { defaultType: 'text', noTypeSelector: true },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: EditableCell,
        meta: { defaultType: 'email' },
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: EditableCell,
        meta: { defaultType: 'phone' },
      },
      {
        accessorFn: (row) => row.billing_address?.address ?? '',
        id: 'address',
        header: 'Billing Address',
        cell: EditableCell,
        meta: { defaultType: 'text' },
      },
      ...customFieldColumns,
    ],
    [customFieldColumns, expandedRows, toggleExpanded, queryClient]
  )

  /** Collect all enum values for a column from currently-loaded contacts */
  const getEnumValues = useCallback(
    (columnId) => {
      const values = new Set()
      for (const contact of contacts) {
        const v = getContactFieldValue(contact, columnId)
        if (v != null && v !== '') values.add(String(v))
      }
      return Array.from(values).sort()
    },
    [contacts]
  )

  const table = useReactTable({
    data: contacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.contact_id,
    meta: {
      isEditMode,
      markDirty,
      clearDirty,
      clearRowDirty,
      isDirty,
      isRowDirty,
      getDirtyValue,
      getColType,
      getEnumValues,
      setValidationError,
      clearValidationError,
    },
  })

  // Build the flat list of pending changes for CommitModal
  const pendingChanges = useMemo(() => {
    const changes = []
    for (const [contactId, fields] of Object.entries(dirtyMap)) {
      const contact = contacts.find((c) => c.contact_id === contactId)
      if (!contact) continue
      for (const [columnId, newValue] of Object.entries(fields)) {
        const original = getContactFieldValue(contact, columnId)
        const colDef = columns.find((c) => (c.accessorKey ?? c.id) === columnId)
        const fieldLabel =
          colDef?.header ?? EXTRA_FIELD_LABELS[columnId] ?? columnId
        changes.push({
          contactId,
          contactName: contact.contact_name,
          field: fieldLabel,
          original,
          newValue,
        })
      }
    }
    return changes
  }, [dirtyMap, contacts, columns])

  // Called by CommitModal — saves all dirty contacts and person mutations sequentially.
  // onProgress(contactId, 'saving' | 'success' | 'error', error?) is called per contact.
  async function handleCommit(onProgress) {
    // --- Contact field edits (sequential to avoid rate limiting) ---
    for (const [contactId, dirtyFields] of Object.entries(dirtyMap)) {
      const original = contacts.find((c) => c.contact_id === contactId)
      if (!original) continue
      debugLog(
        `commit: saving contact ${original.contact_name} (${contactId})`,
        dirtyFields
      )
      onProgress(contactId, 'saving')
      try {
        await saveContact({
          contactId,
          payload: buildPayload(original, dirtyFields),
        })
        debugLog(
          `commit: saved contact ${original.contact_name} (${contactId})`
        )
        onProgress(contactId, 'success')
        setDirtyMap((prev) => {
          const next = { ...prev }
          delete next[contactId]
          return next
        })
      } catch (err) {
        debugLog(
          `commit: failed contact ${original.contact_name} (${contactId})`,
          err
        )
        onProgress(contactId, 'error', err)
        // Leave this contactId in dirtyMap so the user can retry
      }
    }

    // --- Contact person operations ---
    const affectedContactIds = new Set()

    for (const [contactId, persons] of Object.entries(pendingPersonEdits)) {
      const cachedPersons =
        queryClient.getQueryData(['contactPersons', contactId]) ?? []
      const results = await Promise.allSettled(
        Object.entries(persons).map(([personId, fields]) => {
          const original = cachedPersons.find(
            (p) => p.contact_person_id === personId
          )
          if (!original) return Promise.resolve()
          const payload = {
            first_name: fields.first_name ?? original.first_name ?? '',
            last_name: fields.last_name ?? original.last_name ?? '',
            email: fields.email ?? original.email ?? '',
            phone: fields.phone ?? original.phone ?? '',
            mobile: fields.mobile ?? original.mobile ?? '',
            is_primary_contact:
              fields.is_primary_contact ?? original.is_primary_contact ?? false,
            enable_portal:
              fields.enable_portal ?? original.enable_portal ?? false,
          }
          return updateContactPerson(
            accessToken,
            orgId,
            region,
            contactId,
            personId,
            payload
          )
        })
      )
      // Remove only the person edits that succeeded
      const personIds = Object.keys(persons)
      setPendingPersonEdits((prev) => {
        const updatedPersons = { ...(prev[contactId] ?? {}) }
        personIds.forEach((personId, i) => {
          if (results[i].status === 'fulfilled') delete updatedPersons[personId]
        })
        const next = { ...prev }
        if (Object.keys(updatedPersons).length === 0) delete next[contactId]
        else next[contactId] = updatedPersons
        return next
      })
      affectedContactIds.add(contactId)
    }

    for (const [contactId, drafts] of Object.entries(pendingPersonAdds)) {
      const results = await Promise.allSettled(
        drafts.map((d) =>
          createContactPerson(accessToken, orgId, region, contactId, {
            first_name: d.first_name,
            last_name: d.last_name,
            email: d.email,
            phone: d.phone,
            mobile: d.mobile,
          })
        )
      )
      // Remove only successful adds
      setPendingPersonAdds((prev) => {
        const remaining = (prev[contactId] ?? []).filter(
          (_, i) => results[i].status === 'rejected'
        )
        const next = { ...prev }
        if (remaining.length === 0) delete next[contactId]
        else next[contactId] = remaining
        return next
      })
      affectedContactIds.add(contactId)
    }

    for (const [contactId, personIds] of Object.entries(pendingPersonDeletes)) {
      const results = await Promise.allSettled(
        personIds.map((personId) =>
          deleteContactPerson(accessToken, orgId, region, contactId, personId)
        )
      )
      // Remove only successful deletes
      setPendingPersonDeletes((prev) => {
        const remaining = personIds.filter(
          (_, i) => results[i].status === 'rejected'
        )
        const next = { ...prev }
        if (remaining.length === 0) delete next[contactId]
        else next[contactId] = remaining
        return next
      })
      affectedContactIds.add(contactId)
    }

    affectedContactIds.forEach((cid) =>
      queryClient.invalidateQueries({ queryKey: ['contactPersons', cid] })
    )
  }

  function handleCsvApply(importedDirtyMap) {
    setDirtyMap((prev) => {
      const next = { ...prev }
      for (const [contactId, fields] of Object.entries(importedDirtyMap)) {
        next[contactId] = { ...(next[contactId] ?? {}), ...fields }
      }
      return next
    })
    setIsEditMode(true)
  }

  function handlePageSizeChange(value) {
    try {
      localStorage.setItem('customerTable.pageSize', value)
    } catch {
      // ignore storage errors
    }
    setPageSize(value)
    setPage(1)
    setExpandedRows(new Set())
  }

  // Exit edit mode, preserving edits in localStorage for later
  function exitEditMode() {
    setIsEditMode(false)
  }

  // Discard all pending edits and exit edit mode
  function discardEdits() {
    clearAll()
    setIsEditMode(false)
  }

  // After CommitModal closes, exit edit mode if all changes were saved
  function handleModalClose() {
    closeModal()
    if (
      Object.keys(dirtyMap).length === 0 &&
      Object.keys(pendingPersonEdits).length === 0 &&
      Object.keys(pendingPersonAdds).length === 0 &&
      Object.keys(pendingPersonDeletes).length === 0
    ) {
      setIsEditMode(false)
    }
  }

  function handlePageChange(next) {
    setPage(next)
    setExpandedRows(new Set())
  }

  const orgName = orgs.find((o) => o.organization_id === orgId)?.name ?? orgId

  return (
    <Stack p="lg" gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text fw={700} size="xl">
            Customers
          </Text>
          <Text size="sm" c="dimmed">
            {orgName}
          </Text>
        </Stack>
        <Group gap="xs" align="center">
          {!isEditMode && (
            <>
              <Button
                size="sm"
                variant="light"
                onClick={() => setIsEditMode(true)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="light"
                color="teal"
                onClick={openCsvModal}
              >
                Import from CSV
              </Button>
              <Button
                size="sm"
                variant="light"
                color="gray"
                onClick={() =>
                  exportContactsToCsv(contacts, customFieldColumns, orgName)
                }
                disabled={contacts.length === 0}
              >
                Export CSV
              </Button>
            </>
          )}
          {isEditMode && (
            <>
              {dirtyCount + personOpCount > 0 && (
                <Badge color="yellow" variant="light">
                  {dirtyCount + personOpCount} unsaved change
                  {dirtyCount + personOpCount !== 1 ? 's' : ''}
                </Badge>
              )}
              {dirtyCount + personOpCount > 0 ? (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={exitEditMode}
                    title="Exit edit mode — edits are saved and will be restored when you return"
                  >
                    Save &amp; Exit
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    color="red"
                    onClick={discardEdits}
                  >
                    Discard
                  </Button>
                </>
              ) : (
                <Button variant="default" size="sm" onClick={exitEditMode}>
                  Exit
                </Button>
              )}
              <Button
                size="sm"
                color="orange"
                onClick={openModal}
                disabled={
                  dirtyCount + personOpCount === 0 ||
                  isFetching ||
                  hasValidationErrors
                }
              >
                Commit
              </Button>
            </>
          )}
          <Button variant="subtle" color="gray" size="sm" onClick={logout}>
            Log out
          </Button>
        </Group>
      </Group>

      {isError && (
        <Alert color="red" title="Error">
          {error?.message}
        </Alert>
      )}

      <div style={{ overflowX: 'auto' }}>
        <Table
          striped
          highlightOnHover
          withTableBorder
          withColumnBorders
          fz="sm"
        >
          <Table.Thead>
            {table.getHeaderGroups().map((hg) => (
              <Table.Tr key={hg.id}>
                {hg.headers.map((header) => {
                  const colId = header.column.id
                  const noTypeSelector =
                    header.column.columnDef.meta?.noTypeSelector ?? false
                  const defaultType =
                    header.column.columnDef.meta?.defaultType ?? 'text'
                  const effectiveType = getColType(colId, defaultType)
                  return (
                    <Table.Th key={header.id} style={{ whiteSpace: 'nowrap' }}>
                      {header.isPlaceholder || noTypeSelector ? null : (
                        <ColumnHeader
                          label={
                            typeof header.column.columnDef.header === 'string'
                              ? header.column.columnDef.header
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )
                          }
                          columnId={colId}
                          type={effectiveType}
                          onTypeChange={handleTypeChange}
                          isEditMode={isEditMode}
                          isColumnDirty={isColumnDirty(colId)}
                          onRevertColumn={() => clearColumnDirty(colId)}
                        />
                      )}
                    </Table.Th>
                  )
                })}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td
                  colSpan={columns.length}
                  ta="center"
                  c="dimmed"
                  py="xl"
                >
                  Loading…
                </Table.Td>
              </Table.Tr>
            ) : (
              table.getRowModel().rows.flatMap((row) => {
                const isExpanded = expandedRows.has(row.id)
                return [
                  <Table.Tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <Table.Td key={cell.id} py={4} px={6}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Table.Td>
                    ))}
                  </Table.Tr>,
                  isExpanded && (
                    <Table.Tr key={`${row.id}-persons`}>
                      <Table.Td
                        colSpan={columns.length}
                        style={{ padding: 0, background: '#f9fafb' }}
                      >
                        <ContactPersonsPanel
                          contactId={row.id}
                          contacts={contacts}
                          isEditMode={isEditMode}
                          pendingEdits={pendingPersonEdits[row.id] ?? {}}
                          pendingAdds={pendingPersonAdds[row.id] ?? []}
                          pendingDeletes={pendingPersonDeletes[row.id] ?? []}
                          onMarkField={(pId, field, val) =>
                            markPersonField(row.id, pId, field, val)
                          }
                          onClearField={(pId, field) =>
                            clearPersonField(row.id, pId, field)
                          }
                          onRevertRow={(pId) => revertPersonRow(row.id, pId)}
                          onAddPerson={(draft) =>
                            addPendingPerson(row.id, draft)
                          }
                          onCancelAdd={(tempId) =>
                            cancelPendingAdd(row.id, tempId)
                          }
                          onMarkDelete={(pId) => markPersonDelete(row.id, pId)}
                          onUnmarkDelete={(pId) =>
                            unmarkPersonDelete(row.id, pId)
                          }
                        />
                      </Table.Td>
                    </Table.Tr>
                  ),
                ]
              })
            )}
          </Table.Tbody>
        </Table>
      </div>

      <Group gap="sm" align="center" justify="space-between">
        <Group gap="sm" align="center">
          <Button
            variant="default"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, page - 1))}
            disabled={page === 1 || isFetching}
          >
            ← Prev
          </Button>
          <Text size="sm" c="dimmed">
            Page {page}
          </Text>
          <Button
            variant="default"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={!pageContext.has_more_page || isFetching}
          >
            Next →
          </Button>
        </Group>
        <Group gap="xs" align="center">
          <Text size="sm" c="dimmed">
            Rows per page
          </Text>
          <Select
            size="sm"
            w={80}
            value={pageSize}
            onChange={handlePageSizeChange}
            data={PAGE_SIZE_OPTIONS}
            allowDeselect={false}
          />
        </Group>
      </Group>

      <CommitModal
        opened={modalOpened}
        onClose={handleModalClose}
        pendingChanges={pendingChanges}
        onConfirm={handleCommit}
        personOpSummary={{
          edits: Object.values(pendingPersonEdits)
            .flatMap(Object.values)
            .reduce((s, f) => s + Object.keys(f).length, 0),
          adds: Object.values(pendingPersonAdds).reduce(
            (s, a) => s + a.length,
            0
          ),
          deletes: Object.values(pendingPersonDeletes).reduce(
            (s, d) => s + d.length,
            0
          ),
        }}
      />

      <CsvImportModal
        opened={csvModalOpened}
        onClose={closeCsvModal}
        contacts={contacts}
        customFields={contacts[0]?.custom_fields ?? []}
        onApply={handleCsvApply}
      />
    </Stack>
  )
}
