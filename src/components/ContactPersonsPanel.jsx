import { useState, useCallback } from 'react'
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import {
  useContactPersons,
  useUpdateContactPerson,
  useDeleteContactPerson,
} from '../hooks/useContactPersons.js'
import AddContactPersonRow from './AddContactPersonRow.jsx'

function PersonCell({ value, isDirty, onChange }) {
  return (
    <TextInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      size="xs"
      styles={{
        input: {
          borderColor: isDirty ? '#f59e0b' : undefined,
          backgroundColor: isDirty ? '#fefce8' : undefined,
        },
      }}
    />
  )
}

export default function ContactPersonsPanel({ contactId, contacts }) {
  const { data: persons, isLoading } = useContactPersons(contactId)
  const { mutateAsync: savePerson } = useUpdateContactPerson(contactId)
  const { mutateAsync: removePerson } = useDeleteContactPerson(contactId)

  // personDirtyMap: { [personId]: { [field]: newValue } }
  const [personDirtyMap, setPersonDirtyMap] = useState({})
  // confirmingDelete: personId awaiting confirmation, or null
  const [confirmingDelete, setConfirmingDelete] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const markDirty = useCallback((personId, field, value) => {
    setPersonDirtyMap((prev) => ({
      ...prev,
      [personId]: { ...(prev[personId] ?? {}), [field]: value },
    }))
  }, [])

  const clearPersonDirty = useCallback((personId) => {
    setPersonDirtyMap((prev) => {
      const next = { ...prev }
      delete next[personId]
      return next
    })
  }, [])

  async function handleSave(person) {
    const personId = person.contact_person_id
    const dirty = personDirtyMap[personId] ?? {}
    const payload = {
      first_name: dirty.first_name ?? person.first_name ?? '',
      last_name: dirty.last_name ?? person.last_name ?? '',
      email: dirty.email ?? person.email ?? '',
      phone: dirty.phone ?? person.phone ?? '',
      mobile: dirty.mobile ?? person.mobile ?? '',
      is_primary_contact:
        dirty.is_primary_contact ?? person.is_primary_contact ?? false,
      enable_portal: dirty.enable_portal ?? person.enable_portal ?? false,
    }
    await savePerson({ personId, payload })
    clearPersonDirty(personId)
  }

  async function handleDelete(personId) {
    await removePerson({ personId })
    setConfirmingDelete(null)
  }

  return (
    <div style={{ padding: '0.5rem 1rem 0.75rem 2.5rem' }}>
      <Text size="xs" fw={600} c="dimmed" mb={6}>
        Contact Persons
      </Text>
      {isLoading ? (
        <Text size="xs" c="dimmed">
          Loading…
        </Text>
      ) : !persons?.length && !showAdd ? (
        <Text size="xs" c="dimmed">
          No contact persons.{' '}
          <Button variant="subtle" size="compact-xs" onClick={() => setShowAdd(true)}>
            + Add
          </Button>
        </Text>
      ) : (
        <Table fz="xs" withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>First Name</Table.Th>
              <Table.Th>Last Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Mobile</Table.Th>
              <Table.Th>Primary</Table.Th>
              <Table.Th>Notify</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {persons.map((p) => {
              const personId = p.contact_person_id
              const dirty = personDirtyMap[personId] ?? {}
              const isDirtyRow = Object.keys(dirty).length > 0
              const isPrimary =
                dirty.is_primary_contact !== undefined
                  ? dirty.is_primary_contact
                  : (p.is_primary_contact ?? false)
              const enablePortal =
                dirty.enable_portal !== undefined
                  ? dirty.enable_portal
                  : (p.enable_portal ?? false)
              const isConfirming = confirmingDelete === personId

              return (
                <Table.Tr key={personId}>
                  <Table.Td>
                    <PersonCell
                      value={
                        dirty.first_name !== undefined
                          ? dirty.first_name
                          : (p.first_name ?? '')
                      }
                      isDirty={dirty.first_name !== undefined}
                      onChange={(v) => markDirty(personId, 'first_name', v)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <PersonCell
                      value={
                        dirty.last_name !== undefined
                          ? dirty.last_name
                          : (p.last_name ?? '')
                      }
                      isDirty={dirty.last_name !== undefined}
                      onChange={(v) => markDirty(personId, 'last_name', v)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <PersonCell
                      value={
                        dirty.email !== undefined
                          ? dirty.email
                          : (p.email ?? '')
                      }
                      isDirty={dirty.email !== undefined}
                      onChange={(v) => markDirty(personId, 'email', v)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <PersonCell
                      value={
                        dirty.phone !== undefined
                          ? dirty.phone
                          : (p.phone ?? '')
                      }
                      isDirty={dirty.phone !== undefined}
                      onChange={(v) => markDirty(personId, 'phone', v)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <PersonCell
                      value={
                        dirty.mobile !== undefined
                          ? dirty.mobile
                          : (p.mobile ?? '')
                      }
                      isDirty={dirty.mobile !== undefined}
                      onChange={(v) => markDirty(personId, 'mobile', v)}
                    />
                  </Table.Td>
                  <Table.Td ta="center">
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      color={isPrimary ? 'yellow' : 'gray'}
                      onClick={() =>
                        markDirty(personId, 'is_primary_contact', !isPrimary)
                      }
                      aria-label="Toggle primary contact"
                    >
                      {isPrimary ? '★' : '☆'}
                    </ActionIcon>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Checkbox
                      checked={enablePortal}
                      onChange={(e) =>
                        markDirty(
                          personId,
                          'enable_portal',
                          e.currentTarget.checked
                        )
                      }
                      size="xs"
                    />
                  </Table.Td>
                  <Table.Td>
                    {isConfirming ? (
                      <Group gap={4} wrap="nowrap">
                        <Text size="xs" c="red">
                          Delete?
                        </Text>
                        <Button
                          size="compact-xs"
                          color="red"
                          onClick={() => handleDelete(personId)}
                        >
                          Yes
                        </Button>
                        <Button
                          size="compact-xs"
                          variant="default"
                          onClick={() => setConfirmingDelete(null)}
                        >
                          No
                        </Button>
                      </Group>
                    ) : (
                      <Group gap={4} wrap="nowrap">
                        {isDirtyRow && (
                          <Button
                            size="compact-xs"
                            color="orange"
                            onClick={() => handleSave(p)}
                          >
                            Save
                          </Button>
                        )}
                        <Button
                          size="compact-xs"
                          color="red"
                          variant="subtle"
                          onClick={() => setConfirmingDelete(personId)}
                        >
                          Delete
                        </Button>
                      </Group>
                    )}
                  </Table.Td>
                </Table.Tr>
              )
            })}
            {showAdd && (
              <AddContactPersonRow
                contactId={contactId}
                contacts={contacts}
                colSpan={8}
                onCancel={() => setShowAdd(false)}
              />
            )}
          </Table.Tbody>
          {!showAdd && (
            <Table.Tfoot>
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Button variant="subtle" size="compact-xs" onClick={() => setShowAdd(true)}>
                    + Add
                  </Button>
                </Table.Td>
              </Table.Tr>
            </Table.Tfoot>
          )}
        </Table>
      )}
    </div>
  )
}
