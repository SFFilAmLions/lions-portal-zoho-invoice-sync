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

function PersonCell({ value, isDirty, onChange, onRevert, isEditMode }) {
  if (!isEditMode) {
    return <Text size="xs">{value}</Text>
  }
  return (
    <Group gap={4} wrap="nowrap">
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size="xs"
        style={{ flex: 1 }}
        styles={{
          input: {
            borderColor: isDirty ? '#f59e0b' : undefined,
            backgroundColor: isDirty ? '#fefce8' : undefined,
          },
        }}
      />
      {isDirty && onRevert && (
        <ActionIcon
          variant="subtle"
          color="orange"
          size="xs"
          onClick={onRevert}
          aria-label="Revert"
        >
          ×
        </ActionIcon>
      )}
    </Group>
  )
}

export default function ContactPersonsPanel({
  contactId,
  contacts,
  isEditMode,
}) {
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

  const revertField = useCallback((personId, field) => {
    setPersonDirtyMap((prev) => {
      const fields = { ...(prev[personId] ?? {}) }
      delete fields[field]
      const next = { ...prev }
      if (Object.keys(fields).length === 0) delete next[personId]
      else next[personId] = fields
      return next
    })
  }, [])

  const revertRow = useCallback((personId) => {
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
    revertRow(personId)
  }

  async function handleDelete(personId) {
    await removePerson({ personId })
    setConfirmingDelete(null)
  }

  // Number of columns: 5 text + Primary + Notify + Actions = 8
  // In view mode the Actions column is hidden, so colSpan differs
  const colCount = isEditMode ? 8 : 7

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
          {isEditMode && (
            <Button
              variant="subtle"
              size="compact-xs"
              onClick={() => setShowAdd(true)}
            >
              + Add
            </Button>
          )}
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
              {isEditMode && <Table.Th />}
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
                      onRevert={() => revertField(personId, 'first_name')}
                      isEditMode={isEditMode}
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
                      onRevert={() => revertField(personId, 'last_name')}
                      isEditMode={isEditMode}
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
                      onRevert={() => revertField(personId, 'email')}
                      isEditMode={isEditMode}
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
                      onRevert={() => revertField(personId, 'phone')}
                      isEditMode={isEditMode}
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
                      onRevert={() => revertField(personId, 'mobile')}
                      isEditMode={isEditMode}
                    />
                  </Table.Td>
                  <Table.Td ta="center">
                    {isEditMode ? (
                      <Group gap={2} justify="center">
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          color={isPrimary ? 'yellow' : 'gray'}
                          onClick={() =>
                            markDirty(
                              personId,
                              'is_primary_contact',
                              !isPrimary
                            )
                          }
                          aria-label="Toggle primary contact"
                        >
                          {isPrimary ? '★' : '☆'}
                        </ActionIcon>
                        {dirty.is_primary_contact !== undefined && (
                          <ActionIcon
                            variant="subtle"
                            color="orange"
                            size="xs"
                            onClick={() =>
                              revertField(personId, 'is_primary_contact')
                            }
                            aria-label="Revert"
                          >
                            ×
                          </ActionIcon>
                        )}
                      </Group>
                    ) : (
                      <Text size="xs">{isPrimary ? '★' : ''}</Text>
                    )}
                  </Table.Td>
                  <Table.Td ta="center">
                    <Group gap={2} justify="center">
                      <Checkbox
                        checked={enablePortal}
                        onChange={
                          isEditMode
                            ? (e) =>
                                markDirty(
                                  personId,
                                  'enable_portal',
                                  e.currentTarget.checked
                                )
                            : undefined
                        }
                        readOnly={!isEditMode}
                        size="xs"
                      />
                      {isEditMode && dirty.enable_portal !== undefined && (
                        <ActionIcon
                          variant="subtle"
                          color="orange"
                          size="xs"
                          onClick={() => revertField(personId, 'enable_portal')}
                          aria-label="Revert"
                        >
                          ×
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>
                  {isEditMode && (
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
                            <>
                              <Button
                                size="compact-xs"
                                color="orange"
                                onClick={() => handleSave(p)}
                              >
                                Save
                              </Button>
                              <Button
                                size="compact-xs"
                                variant="subtle"
                                color="orange"
                                onClick={() => revertRow(personId)}
                              >
                                Revert
                              </Button>
                            </>
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
                  )}
                </Table.Tr>
              )
            })}
            {isEditMode && showAdd && (
              <AddContactPersonRow
                contactId={contactId}
                contacts={contacts}
                colSpan={colCount}
                onCancel={() => setShowAdd(false)}
              />
            )}
          </Table.Tbody>
          {isEditMode && !showAdd && (
            <Table.Tfoot>
              <Table.Tr>
                <Table.Td colSpan={colCount}>
                  <Button
                    variant="subtle"
                    size="compact-xs"
                    onClick={() => setShowAdd(true)}
                  >
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
