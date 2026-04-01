import { useState } from 'react'
import { Anchor, Select, Stack, Text, TextInput } from '@mantine/core'

const ADD_NEW_SENTINEL = '__add_new__'

export default function EditableCell({ getValue, row, column, table }) {
  const initialValue = getValue() ?? ''
  const [value, setValue] = useState(initialValue)
  // Tracks a newly typed value when user picks "Add new…" in enum mode
  const [addingNew, setAddingNew] = useState(false)
  const [newEnumValue, setNewEnumValue] = useState('')

  const contactId = row.original.contact_id
  const columnId = column.id
  const meta = table.options.meta ?? {}
  const isEditMode = meta.isEditMode ?? false
  const isDirty = meta.isDirty(contactId, columnId) ?? false
  const dirtyValue = meta.getDirtyValue(contactId, columnId)

  // Resolve column type from table meta
  const defaultType = column.columnDef.meta?.defaultType ?? 'text'
  const type = meta.getColType
    ? meta.getColType(columnId, defaultType)
    : defaultType

  // The "original" text shown in the "was: ..." label is the server value
  const originalValue = initialValue

  // The currently displayed value (dirty wins)
  const displayValue = isDirty ? dirtyValue : originalValue

  // --- Shared blur handler for text/email/phone ---
  function handleBlur() {
    if (value !== originalValue) {
      meta.markDirty(contactId, columnId, value)
    } else if (isDirty && value === originalValue) {
      meta.clearDirty(contactId, columnId)
    }
  }

  // --- View mode ---
  if (!isEditMode) {
    if (type === 'email' && displayValue) {
      return (
        <Anchor href={`mailto:${displayValue}`} size="sm">
          {displayValue}
        </Anchor>
      )
    }
    return <Text size="sm">{displayValue}</Text>
  }

  // --- Edit mode: enum ---
  if (type === 'enum') {
    const enumValues = meta.getEnumValues ? meta.getEnumValues(columnId) : []
    const selectData = [
      ...enumValues.map((v) => ({ value: v, label: v })),
      { value: ADD_NEW_SENTINEL, label: 'Add new…' },
    ]

    // Currently selected value for the Select (use dirty if set, else original)
    const selectValue = isDirty ? dirtyValue : originalValue

    function handleSelectChange(selected) {
      if (selected === ADD_NEW_SENTINEL) {
        setAddingNew(true)
        setNewEnumValue('')
        return
      }
      setAddingNew(false)
      if (selected !== originalValue) {
        meta.markDirty(contactId, columnId, selected ?? '')
      } else if (isDirty) {
        meta.clearDirty(contactId, columnId)
      }
    }

    function handleNewEnumBlur() {
      const trimmed = newEnumValue.trim()
      if (trimmed === '') {
        // Revert to original
        setAddingNew(false)
        if (isDirty) meta.clearDirty(contactId, columnId)
        return
      }
      setAddingNew(false)
      if (trimmed !== originalValue) {
        meta.markDirty(contactId, columnId, trimmed)
      } else if (isDirty) {
        meta.clearDirty(contactId, columnId)
      }
    }

    return (
      <Stack gap={2}>
        {addingNew ? (
          <TextInput
            autoFocus
            value={newEnumValue}
            onChange={(e) => setNewEnumValue(e.target.value)}
            onBlur={handleNewEnumBlur}
            placeholder="Type new value…"
            size="xs"
            styles={{
              input: {
                borderColor: isDirty ? '#f59e0b' : undefined,
                backgroundColor: isDirty ? '#fefce8' : undefined,
              },
            }}
          />
        ) : (
          <Select
            value={selectValue || null}
            onChange={handleSelectChange}
            data={selectData}
            size="xs"
            allowDeselect={false}
            comboboxProps={{ withinPortal: true }}
            styles={{
              input: {
                borderColor: isDirty ? '#f59e0b' : undefined,
                backgroundColor: isDirty ? '#fefce8' : undefined,
              },
            }}
          />
        )}
        {isDirty && (
          <Text size="xs" c="dimmed" fs="italic">
            was: {originalValue}
          </Text>
        )}
      </Stack>
    )
  }

  // --- Edit mode: text / email / phone ---
  const inputType =
    type === 'email' ? 'email' : type === 'phone' ? 'tel' : 'text'

  return (
    <Stack gap={2}>
      <TextInput
        type={inputType}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        size="xs"
        styles={{
          input: {
            borderColor: isDirty ? '#f59e0b' : undefined,
            backgroundColor: isDirty ? '#fefce8' : undefined,
          },
        }}
      />
      {isDirty && (
        <Text size="xs" c="dimmed" fs="italic">
          was: {originalValue}
        </Text>
      )}
    </Stack>
  )
}
