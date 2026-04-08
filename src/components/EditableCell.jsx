import { useState } from 'react'
import {
  ActionIcon,
  Anchor,
  Checkbox,
  Group,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'

const ADD_NEW_SENTINEL = '__add_new__'

/** Validate a value for a given column type. Returns error string or null. */
function validate(type, value) {
  if (!value || value === '') return null
  if (type === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? null
      : 'Must be a valid email'
  }
  if (type === 'url') {
    return /^https?:\/\//i.test(value)
      ? null
      : 'Must be a valid URL (https://…)'
  }
  if (type === 'date') {
    return !isNaN(new Date(value)) ? null : 'Must be a valid date'
  }
  return null
}

export default function EditableCell({ getValue, row, column, table }) {
  const initialValue = getValue() ?? ''
  const [value, setValue] = useState(initialValue)
  const [validationError, setValidationErrorLocal] = useState(null)
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

  function reportValidationError(error) {
    setValidationErrorLocal(error)
    if (error) {
      meta.setValidationError?.(contactId, columnId, error)
    } else {
      meta.clearValidationError?.(contactId, columnId)
    }
  }

  function handleRevert() {
    meta.clearDirty(contactId, columnId)
    setValue(initialValue)
    setAddingNew(false)
    reportValidationError(null)
  }

  // --- Shared blur handler for text/email/phone/url ---
  function handleBlur() {
    const err = validate(type, value)
    reportValidationError(err)
    if (err) return // don't mark dirty if invalid

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
    if (type === 'url') {
      if (displayValue) {
        return (
          <Anchor
            href={displayValue}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
          >
            {displayValue}
          </Anchor>
        )
      }
      return <Text size="sm">{displayValue}</Text>
    }
    if (type === 'boolean') {
      return (
        <Text size="sm">
          {displayValue === true || displayValue === 'true' ? 'Yes' : 'No'}
        </Text>
      )
    }
    return <Text size="sm">{displayValue}</Text>
  }

  // --- Edit mode: boolean ---
  if (type === 'boolean') {
    const boolValue = isDirty
      ? dirtyValue === true || dirtyValue === 'true'
      : initialValue === true || initialValue === 'true'

    function handleCheckboxChange(e) {
      const checked = e.currentTarget.checked
      if (checked !== (originalValue === true || originalValue === 'true')) {
        meta.markDirty(contactId, columnId, checked)
      } else if (isDirty) {
        meta.clearDirty(contactId, columnId)
      }
    }

    return (
      <Stack gap={2}>
        <Group gap={4} align="center">
          <Checkbox
            checked={boolValue}
            onChange={handleCheckboxChange}
            size="xs"
            styles={{
              input: {
                cursor: 'pointer',
                borderColor: isDirty ? '#f59e0b' : undefined,
              },
            }}
          />
          {isDirty && (
            <ActionIcon
              variant="subtle"
              color="orange"
              size="xs"
              onClick={handleRevert}
              aria-label="Revert"
            >
              ↩
            </ActionIcon>
          )}
        </Group>
        {isDirty && (
          <Text size="xs" c="dimmed" fs="italic">
            was:{' '}
            {originalValue === true || originalValue === 'true' ? 'Yes' : 'No'}
          </Text>
        )}
      </Stack>
    )
  }

  // --- Edit mode: date ---
  if (type === 'date') {
    // Convert stored string to Date object for DateInput
    const dateValue = isDirty
      ? dirtyValue
        ? new Date(dirtyValue)
        : null
      : originalValue
        ? new Date(originalValue)
        : null
    const validDateValue = dateValue && !isNaN(dateValue) ? dateValue : null

    function handleDateChange(newDate) {
      const strValue = newDate ? newDate.toISOString().split('T')[0] : ''
      const err = validate('date', strValue)
      reportValidationError(err)
      if (!err) {
        if (strValue !== originalValue) {
          meta.markDirty(contactId, columnId, strValue)
        } else if (isDirty) {
          meta.clearDirty(contactId, columnId)
        }
      }
    }

    return (
      <Stack gap={2}>
        <Group gap={4} align="flex-start">
          <DateInput
            value={validDateValue}
            onChange={handleDateChange}
            size="xs"
            error={validationError}
            clearable
            valueFormat="YYYY-MM-DD"
            styles={{
              input: {
                borderColor:
                  isDirty && !validationError ? '#f59e0b' : undefined,
                backgroundColor:
                  isDirty && !validationError ? '#fefce8' : undefined,
              },
            }}
          />
          {isDirty && (
            <ActionIcon
              variant="subtle"
              color="orange"
              size="xs"
              onClick={handleRevert}
              aria-label="Revert"
              style={{ marginTop: 4 }}
            >
              ↩
            </ActionIcon>
          )}
        </Group>
        {isDirty && !validationError && (
          <Text size="xs" c="dimmed" fs="italic">
            was: {originalValue}
          </Text>
        )}
      </Stack>
    )
  }

  // --- Edit mode: enum ---
  if (type === 'enum') {
    const enumValues = meta.getEnumValues ? meta.getEnumValues(columnId) : []

    // Include dirty value if it's not already in the known enum values
    const currentDirtyVal = isDirty ? dirtyValue : null
    const allEnumValues =
      currentDirtyVal && !enumValues.includes(currentDirtyVal)
        ? [...enumValues, currentDirtyVal]
        : enumValues

    const selectData = [
      ...allEnumValues.map((v) => ({ value: v, label: v })),
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
        <Group gap={4} align="flex-start">
          {addingNew ? (
            <TextInput
              autoFocus
              value={newEnumValue}
              onChange={(e) => setNewEnumValue(e.target.value)}
              onBlur={handleNewEnumBlur}
              placeholder="Type new value…"
              size="xs"
              style={{ flex: 1 }}
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
              style={{ flex: 1 }}
              styles={{
                input: {
                  borderColor: isDirty ? '#f59e0b' : undefined,
                  backgroundColor: isDirty ? '#fefce8' : undefined,
                },
              }}
            />
          )}
          {isDirty && (
            <ActionIcon
              variant="subtle"
              color="orange"
              size="xs"
              onClick={handleRevert}
              aria-label="Revert"
              style={{ marginTop: 4 }}
            >
              ↩
            </ActionIcon>
          )}
        </Group>
        {isDirty && (
          <Text size="xs" c="dimmed" fs="italic">
            was: {originalValue}
          </Text>
        )}
      </Stack>
    )
  }

  // --- Edit mode: text / email / phone / url ---
  const inputType =
    type === 'email'
      ? 'email'
      : type === 'phone'
        ? 'tel'
        : type === 'url'
          ? 'url'
          : 'text'

  return (
    <Stack gap={2}>
      <Group gap={4} align="flex-start">
        <TextInput
          type={inputType}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          error={validationError}
          size="xs"
          style={{ flex: 1 }}
          styles={{
            input: {
              borderColor: isDirty && !validationError ? '#f59e0b' : undefined,
              backgroundColor:
                isDirty && !validationError ? '#fefce8' : undefined,
            },
          }}
        />
        {isDirty && (
          <ActionIcon
            variant="subtle"
            color="orange"
            size="xs"
            onClick={handleRevert}
            aria-label="Revert"
            style={{ marginTop: 4 }}
          >
            ↩
          </ActionIcon>
        )}
      </Group>
      {isDirty && !validationError && (
        <Text size="xs" c="dimmed" fs="italic">
          was: {originalValue}
        </Text>
      )}
    </Stack>
  )
}
