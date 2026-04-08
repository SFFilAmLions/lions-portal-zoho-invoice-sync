import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { useContactPersons } from '../hooks/useContactPersons.js'
import AddContactPersonRow from './AddContactPersonRow.jsx'

function PersonCell({
  value,
  isDirty,
  onChange,
  onRevert,
  isEditMode,
  isDeleted,
}) {
  if (!isEditMode || isDeleted) {
    return (
      <Text
        size="xs"
        td={isDeleted ? 'line-through' : undefined}
        c={isDeleted ? 'dimmed' : undefined}
      >
        {value}
      </Text>
    )
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
  pendingEdits,
  pendingAdds,
  pendingDeletes,
  onMarkField,
  onClearField,
  onRevertRow,
  onAddPerson,
  onCancelAdd,
  onMarkDelete,
  onUnmarkDelete,
}) {
  const { data: persons, isLoading } = useContactPersons(contactId)
  const [showAdd, setShowAdd] = useState(false)

  // Number of columns: 5 text + Primary + Notify + Actions = 8
  // In view mode the Actions column is hidden, so colSpan differs
  const colCount = isEditMode ? 8 : 7

  const hasRows =
    (persons?.length ?? 0) > 0 || pendingAdds.length > 0 || showAdd

  return (
    <div style={{ padding: '0.5rem 1rem 0.75rem 2.5rem' }}>
      <Text size="xs" fw={600} c="dimmed" mb={6}>
        Contact Persons
      </Text>
      {isLoading ? (
        <Text size="xs" c="dimmed">
          Loading…
        </Text>
      ) : !hasRows ? (
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
            {persons?.map((p) => {
              const personId = p.contact_person_id
              const dirty = pendingEdits[personId] ?? {}
              const isDirtyRow = Object.keys(dirty).length > 0
              const isDeleted = pendingDeletes.includes(personId)
              const isPrimary =
                dirty.is_primary_contact !== undefined
                  ? dirty.is_primary_contact
                  : (p.is_primary_contact ?? false)
              const enablePortal =
                dirty.enable_portal !== undefined
                  ? dirty.enable_portal
                  : (p.enable_portal ?? false)

              return (
                <Table.Tr
                  key={personId}
                  style={isDeleted ? { opacity: 0.5 } : undefined}
                >
                  <Table.Td>
                    <PersonCell
                      value={
                        dirty.first_name !== undefined
                          ? dirty.first_name
                          : (p.first_name ?? '')
                      }
                      isDirty={dirty.first_name !== undefined}
                      onChange={(v) => onMarkField(personId, 'first_name', v)}
                      onRevert={() => onClearField(personId, 'first_name')}
                      isEditMode={isEditMode}
                      isDeleted={isDeleted}
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
                      onChange={(v) => onMarkField(personId, 'last_name', v)}
                      onRevert={() => onClearField(personId, 'last_name')}
                      isEditMode={isEditMode}
                      isDeleted={isDeleted}
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
                      onChange={(v) => onMarkField(personId, 'email', v)}
                      onRevert={() => onClearField(personId, 'email')}
                      isEditMode={isEditMode}
                      isDeleted={isDeleted}
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
                      onChange={(v) => onMarkField(personId, 'phone', v)}
                      onRevert={() => onClearField(personId, 'phone')}
                      isEditMode={isEditMode}
                      isDeleted={isDeleted}
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
                      onChange={(v) => onMarkField(personId, 'mobile', v)}
                      onRevert={() => onClearField(personId, 'mobile')}
                      isEditMode={isEditMode}
                      isDeleted={isDeleted}
                    />
                  </Table.Td>
                  <Table.Td ta="center">
                    {isEditMode && !isDeleted ? (
                      <Group gap={2} justify="center">
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          color={isPrimary ? 'yellow' : 'gray'}
                          onClick={() =>
                            onMarkField(
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
                              onClearField(personId, 'is_primary_contact')
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
                          isEditMode && !isDeleted
                            ? (e) =>
                                onMarkField(
                                  personId,
                                  'enable_portal',
                                  e.currentTarget.checked
                                )
                            : undefined
                        }
                        readOnly={!isEditMode || isDeleted}
                        size="xs"
                      />
                      {isEditMode &&
                        !isDeleted &&
                        dirty.enable_portal !== undefined && (
                          <ActionIcon
                            variant="subtle"
                            color="orange"
                            size="xs"
                            onClick={() =>
                              onClearField(personId, 'enable_portal')
                            }
                            aria-label="Revert"
                          >
                            ×
                          </ActionIcon>
                        )}
                    </Group>
                  </Table.Td>
                  {isEditMode && (
                    <Table.Td>
                      {isDeleted ? (
                        <Button
                          size="compact-xs"
                          variant="subtle"
                          color="red"
                          onClick={() => onUnmarkDelete(personId)}
                        >
                          Undo
                        </Button>
                      ) : (
                        <Group gap={4} wrap="nowrap">
                          {isDirtyRow && (
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              color="orange"
                              onClick={() => onRevertRow(personId)}
                            >
                              Revert
                            </Button>
                          )}
                          <Button
                            size="compact-xs"
                            color="red"
                            variant="subtle"
                            onClick={() => onMarkDelete(personId)}
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
            {pendingAdds.map((draft) => (
              <Table.Tr
                key={draft._tempId}
                style={{ backgroundColor: '#f0fdf4' }}
              >
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    <Badge size="xs" color="green">
                      New
                    </Badge>
                    <Text size="xs">{draft.first_name}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">{draft.last_name}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">{draft.email}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">{draft.phone}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="xs">{draft.mobile}</Text>
                </Table.Td>
                <Table.Td />
                <Table.Td />
                {isEditMode && (
                  <Table.Td>
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      color="red"
                      onClick={() => onCancelAdd(draft._tempId)}
                    >
                      ×
                    </Button>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
            {isEditMode && showAdd && (
              <AddContactPersonRow
                contacts={contacts}
                colSpan={colCount}
                onSave={onAddPerson}
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
