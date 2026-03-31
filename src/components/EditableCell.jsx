import { useState } from 'react'
import { TextInput } from '@mantine/core'

export default function EditableCell({ getValue, row, column, table }) {
  const initialValue = getValue() ?? ''
  const [value, setValue] = useState(initialValue)

  const contactId = row.original.contact_id
  const columnId = column.id
  const isDirty = table.options.meta?.isDirty(contactId, columnId) ?? false

  function handleBlur() {
    if (value !== initialValue) {
      table.options.meta?.markDirty(contactId, columnId, value)
    }
  }

  return (
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
  )
}
