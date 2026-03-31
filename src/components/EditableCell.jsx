import { useState } from 'react'

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

  // Sync if the underlying data changes (e.g. after a save + re-fetch)
  if (
    initialValue !==
    (table.options.meta?.getCommitted?.(contactId, columnId) ?? initialValue)
  ) {
    // no-op; keeping local value intentional until user blurs
  }

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        padding: '4px 6px',
        border: isDirty ? '1.5px solid #f59e0b' : '1px solid #d1d5db',
        borderRadius: '3px',
        background: isDirty ? '#fefce8' : 'transparent',
        fontSize: '0.875rem',
        outline: 'none',
      }}
    />
  )
}
