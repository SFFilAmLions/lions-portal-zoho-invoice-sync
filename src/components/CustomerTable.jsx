import { useState, useCallback, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import {
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
import EditableCell from './EditableCell.jsx'
import CommitModal from './CommitModal.jsx'
import ContactPersonsPanel from './ContactPersonsPanel.jsx'

const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100']
const DEFAULT_PAGE_SIZE = '25'

const COOKIE_NAME = 'lions-col-types'
const COLUMN_TYPES = [
  'text',
  'email',
  'phone',
  'enum',
  'url',
  'boolean',
  'date',
]

/** Auto-type a custom field based on its Zoho data_type */
function defaultTypeForCustomField(cf) {
  if (cf.data_type === 'dropdown') return 'enum'
  return 'text'
}

// --- Cookie helpers (no external library) ---

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
  const first = dirtyFields.first_name ?? original.first_name ?? ''
  const last = dirtyFields.last_name ?? original.last_name ?? ''

  const payload = {
    contact_name: `${first} ${last}`.trim(),
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
    if (field === 'first_name' || field === 'last_name') {
      // already handled above
    } else if (field === 'address') {
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

/** Small header component that renders the column name + type override badge */
function ColumnHeader({ label, columnId, type, onTypeChange }) {
  return (
    <Group gap={4} align="center" wrap="nowrap">
      <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
        {label}
      </Text>
      <Select
        size="xs"
        w={70}
        value={type}
        onChange={(val) => val && onTypeChange(columnId, val)}
        data={COLUMN_TYPES}
        allowDeselect={false}
        comboboxProps={{ withinPortal: true }}
        styles={{
          input: {
            fontSize: '10px',
            paddingLeft: 4,
            paddingRight: 20,
            height: 20,
            minHeight: 20,
          },
          section: { width: 16 },
        }}
        renderOption={({ option }) => (
          <Badge size="xs" variant="light" color="gray">
            {option.value}
          </Badge>
        )}
      />
    </Group>
  )
}

export default function CustomerTable() {
  const { logout, orgs, orgId } = useZohoAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(getStoredPageSize)
  const { data, isLoading, isFetching, isError, error } = useCustomers({
    page,
    perPage: Number(pageSize),
  })
  const { mutateAsync: saveContact } = useUpdateContact()

  // Edit mode toggle
  const [isEditMode, setIsEditMode] = useState(false)

  // dirtyMap: { [contactId]: { [columnId]: newValue } }
  const [dirtyMap, setDirtyMap] = useState({})

  // validationErrors: { [contactId]: { [columnId]: string } }
  const [validationErrors, setValidationErrors] = useState({})

  // CommitModal open state
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false)

  // Column type overrides: { [columnId]: type } — seeded from cookie on mount
  const [colTypeOverrides, setColTypeOverrides] = useState(readColTypesCookie)

  // expandedRows: Set of contact_id strings currently expanded
  const [expandedRows, setExpandedRows] = useState(new Set())

  const markDirty = useCallback((contactId, columnId, value) => {
    setDirtyMap((prev) => ({
      ...prev,
      [contactId]: { ...(prev[contactId] ?? {}), [columnId]: value },
    }))
  }, [])

  const clearDirty = useCallback((contactId, columnId) => {
    setDirtyMap((prev) => {
      const contactFields = { ...(prev[contactId] ?? {}) }
      delete contactFields[columnId]
      const next = { ...prev }
      if (Object.keys(contactFields).length === 0) {
        delete next[contactId]
      } else {
        next[contactId] = contactFields
      }
      return next
    })
  }, [])

  const setValidationError = useCallback((contactId, columnId, error) => {
    setValidationErrors((prev) => ({
      ...prev,
      [contactId]: { ...(prev[contactId] ?? {}), [columnId]: error },
    }))
  }, [])

  const clearValidationError = useCallback((contactId, columnId) => {
    setValidationErrors((prev) => {
      const contactFields = { ...(prev[contactId] ?? {}) }
      delete contactFields[columnId]
      const next = { ...prev }
      if (Object.keys(contactFields).length === 0) {
        delete next[contactId]
      } else {
        next[contactId] = contactFields
      }
      return next
    })
  }, [])

  const isDirty = useCallback(
    (contactId, columnId) => dirtyMap[contactId]?.[columnId] !== undefined,
    [dirtyMap]
  )

  const getDirtyValue = useCallback(
    (contactId, columnId) => dirtyMap[contactId]?.[columnId],
    [dirtyMap]
  )

  const hasValidationErrors = useMemo(
    () =>
      Object.values(validationErrors).some(
        (fields) => Object.keys(fields).length > 0
      ),
    [validationErrors]
  )

  const dirtyCount = useMemo(
    () =>
      Object.values(dirtyMap).reduce(
        (acc, fields) => acc + Object.keys(fields).length,
        0
      ),
    [dirtyMap]
  )

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

  const columns = useMemo(
    () => [
      {
        id: 'expander',
        header: '',
        meta: { noTypeSelector: true },
        cell: ({ row }) => {
          const cached = queryClient.getQueryData(['contactPersons', row.id])
          // cached takes precedence (accurate after first expand); fall back to
          // the count Zoho returns inline with the contacts list response
          const count =
            cached?.length ?? row.original.contact_persons?.length
          return (
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
          )
        },
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
        let v
        if (columnId === 'address') {
          v = contact.billing_address?.address
        } else if (columnId.startsWith('cf_')) {
          v = contact.custom_fields?.find((f) => f.api_name === columnId)?.value
        } else {
          v = contact[columnId]
        }
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
      isDirty,
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
        // Resolve original value for this column
        let original = ''
        if (columnId === 'address') {
          original = contact.billing_address?.address ?? ''
        } else if (columnId.startsWith('cf_')) {
          original =
            contact.custom_fields?.find((f) => f.api_name === columnId)
              ?.value ?? ''
        } else {
          original = contact[columnId] ?? ''
        }

        // Resolve human-readable field label from column definitions
        const colDef = columns.find((c) => (c.accessorKey ?? c.id) === columnId)
        const fieldLabel = colDef?.header ?? columnId

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

  // Called by CommitModal — saves all dirty contacts and returns a Map of results
  async function handleCommit() {
    const entries = Object.entries(dirtyMap)
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

    // Return a Map of contactId → Error|null for the modal to display
    const resultMap = new Map()
    entries.forEach(([contactId], i) => {
      resultMap.set(
        contactId,
        results[i].status === 'rejected' ? results[i].reason : null
      )
    })
    return resultMap
  }

  function enterEditMode() {
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

  function cancelEditMode() {
    setDirtyMap({})
    setValidationErrors({})
    setIsEditMode(false)
  }

  // After CommitModal closes following a successful save, exit edit mode
  function handleModalClose() {
    closeModal()
    // If all changes were saved (dirtyMap is empty), exit edit mode
    // If there were errors, stay in edit mode so the user can retry
    if (Object.keys(dirtyMap).length === 0) {
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
            <Button size="sm" variant="light" onClick={enterEditMode}>
              Edit
            </Button>
          )}
          {isEditMode && (
            <>
              {dirtyCount > 0 && (
                <Badge color="yellow" variant="light">
                  {dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}
                </Badge>
              )}
              <Button variant="default" size="sm" onClick={cancelEditMode}>
                Cancel
              </Button>
              <Button
                size="sm"
                color="orange"
                onClick={openModal}
                disabled={dirtyCount === 0 || isFetching || hasValidationErrors}
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
      />
    </Stack>
  )
}
