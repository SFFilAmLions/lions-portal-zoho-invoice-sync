import { useState, useCallback, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { Alert, Badge, Button, Group, Stack, Table, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useZohoAuth } from '../hooks/useZohoAuth.js'
import { useCustomers, useUpdateContact } from '../hooks/useCustomers.js'
import EditableCell from './EditableCell.jsx'
import CommitModal from './CommitModal.jsx'

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

  // Edit mode toggle
  const [isEditMode, setIsEditMode] = useState(false)

  // dirtyMap: { [contactId]: { [columnId]: newValue } }
  const [dirtyMap, setDirtyMap] = useState({})

  // CommitModal open state
  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false)

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

  const isDirty = useCallback(
    (contactId, columnId) => dirtyMap[contactId]?.[columnId] !== undefined,
    [dirtyMap]
  )

  const getDirtyValue = useCallback(
    (contactId, columnId) => dirtyMap[contactId]?.[columnId],
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
      { accessorKey: 'contact_name', header: 'Name', cell: EditableCell },
      { accessorKey: 'email', header: 'Email', cell: EditableCell },
      { accessorKey: 'phone', header: 'Phone', cell: EditableCell },
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
    meta: { isEditMode, markDirty, clearDirty, isDirty, getDirtyValue },
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

  function cancelEditMode() {
    setDirtyMap({})
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

  const orgName = orgs.find((o) => o.organization_id === orgId)?.name ?? orgId

  return (
    <Stack p="lg" maw={1200} mx="auto" gap="md">
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
                disabled={dirtyCount === 0 || isFetching}
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
                {hg.headers.map((header) => (
                  <Table.Th key={header.id} style={{ whiteSpace: 'nowrap' }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </Table.Th>
                ))}
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
              table.getRowModel().rows.map((row) => (
                <Table.Tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <Table.Td key={cell.id} py={4} px={6}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>

      <Group gap="sm" align="center">
        <Button
          variant="default"
          size="sm"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
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
          onClick={() => setPage((p) => p + 1)}
          disabled={!pageContext.has_more_page || isFetching}
        >
          Next →
        </Button>
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
