import { useState, useCallback, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { Alert, Badge, Button, Group, Stack, Table, Text } from '@mantine/core'
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
          {dirtyCount > 0 && (
            <>
              <Badge color="yellow" variant="light">
                {dirtyCount} unsaved change{dirtyCount !== 1 ? 's' : ''}
              </Badge>
              <Button
                variant="default"
                size="sm"
                onClick={() => setDirtyMap({})}
              >
                Discard
              </Button>
              <Button
                size="sm"
                color="orange"
                onClick={saveAll}
                disabled={isFetching}
              >
                Save All
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
    </Stack>
  )
}
