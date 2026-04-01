import { useState } from 'react'
import { Stack, Text, TextInput } from '@mantine/core'

export default function EditableCell({ getValue, row, column, table }) {
  const initialValue = getValue() ?? ''
  const [value, setValue] = useState(initialValue)

  const contactId = row.original.contact_id
  const columnId = column.id
  const meta = table.options.meta ?? {}
  const isEditMode = meta.isEditMode ?? false
  const isDirty = meta.isDirty(contactId, columnId) ?? false
  const dirtyValue = meta.getDirtyValue(contactId, columnId)

  // The "original" text shown in the "was: ..." label is the server value
  const originalValue = initialValue

  // Displayed value: use dirtyMap value if dirty, otherwise the local state
  // Local state tracks keystrokes; blur commits to dirtyMap
  function handleBlur() {
    if (value !== originalValue) {
      meta.markDirty(contactId, columnId, value)
    } else if (isDirty && value === originalValue) {
      // User reverted the value — remove from dirty map
      meta.clearDirty(contactId, columnId)
    }
  }

  if (!isEditMode) {
    // View mode: plain text; show dirty value if present (shouldn't normally happen,
    // but guards against stale state when toggling back without clearing)
    return <Text size="sm">{isDirty ? dirtyValue : originalValue}</Text>
  }

  return (
    <Stack gap={2}>
      <TextInput
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
