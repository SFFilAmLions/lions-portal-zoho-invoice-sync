import { ActionIcon, Badge, Group, Select, Text } from '@mantine/core'

const COLUMN_TYPES = [
  'text',
  'email',
  'phone',
  'enum',
  'url',
  'boolean',
  'date',
]

export default function ColumnHeader({
  label,
  columnId,
  type,
  onTypeChange,
  isEditMode,
  isColumnDirty,
  onRevertColumn,
}) {
  return (
    <Group gap={4} align="center" wrap="nowrap">
      <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>
        {label}
      </Text>
      {isEditMode && isColumnDirty && (
        <ActionIcon
          size="xs"
          variant="subtle"
          color="orange"
          onClick={onRevertColumn}
          title="Revert all changes in this column"
          aria-label="Revert column"
        >
          ↩
        </ActionIcon>
      )}
      <Select
        size="xs"
        w={70}
        value={type}
        onChange={(val) => val && onTypeChange(columnId, val)}
        data={COLUMN_TYPES}
        allowDeselect={false}
        comboboxProps={{ withinPortal: true }}
        styles={{
          input: {
            fontSize: '10px',
            paddingLeft: 4,
            paddingRight: 20,
            height: 20,
            minHeight: 20,
          },
          section: { width: 16 },
        }}
        renderOption={({ option }) => (
          <Badge size="xs" variant="light" color="gray">
            {option.value}
          </Badge>
        )}
      />
    </Group>
  )
}
