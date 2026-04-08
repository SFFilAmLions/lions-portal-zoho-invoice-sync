import { useState } from 'react'
import {
  Alert,
  Button,
  Group,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
} from '@mantine/core'

/**
 * CommitModal — lists all pending changes and confirms save.
 *
 * Props:
 *   opened       {boolean}
 *   onClose      {() => void}       called when modal should close (cancel or done)
 *   pendingChanges {Array<{
 *     contactId: string,
 *     contactName: string,
 *     field: string,
 *     original: string,
 *     newValue: string,
 *   }>}
 *   onConfirm    {() => Promise<Map<string, Error|null>>}
 *                resolves with a Map of contactId → Error (null means success)
 *   personOpSummary {edits: number, adds: number, deletes: number}
 */
export default function CommitModal({
  opened,
  onClose,
  pendingChanges,
  onConfirm,
  personOpSummary,
}) {
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({}) // { [contactId]: string }

  async function handleConfirm() {
    setSaving(true)
    setErrors({})
    try {
      const resultMap = await onConfirm()
      const newErrors = {}
      for (const [contactId, err] of resultMap) {
        if (err) newErrors[contactId] = err.message ?? String(err)
      }
      setErrors(newErrors)
      if (Object.keys(newErrors).length === 0) {
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    if (saving) return
    setErrors({})
    onClose()
  }

  // Collect unique contact IDs that have errors
  const contactIdsWithErrors = new Set(Object.keys(errors))

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Confirm changes"
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Review the pending changes below. Click &ldquo;Confirm &amp;
          Save&rdquo; to write them to Zoho.
        </Text>

        <Table withTableBorder withColumnBorders fz="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Contact</Table.Th>
              <Table.Th>Field</Table.Th>
              <Table.Th>Original</Table.Th>
              <Table.Th>New value</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pendingChanges.map((change, i) => (
              <Table.Tr
                key={i}
                style={
                  contactIdsWithErrors.has(change.contactId)
                    ? { backgroundColor: '#fff1f2' }
                    : undefined
                }
              >
                <Table.Td>{change.contactName}</Table.Td>
                <Table.Td>{change.field}</Table.Td>
                <Table.Td c="dimmed">{change.original}</Table.Td>
                <Table.Td fw={500}>{change.newValue}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>

        {(personOpSummary?.edits > 0 ||
          personOpSummary?.adds > 0 ||
          personOpSummary?.deletes > 0) && (
          <Stack gap={4}>
            <Text size="sm" fw={600}>
              Contact person operations
            </Text>
            {personOpSummary.edits > 0 && (
              <Text size="sm" c="dimmed">
                • {personOpSummary.edits} field edit
                {personOpSummary.edits !== 1 ? 's' : ''}
              </Text>
            )}
            {personOpSummary.adds > 0 && (
              <Text size="sm" c="dimmed">
                • {personOpSummary.adds} addition
                {personOpSummary.adds !== 1 ? 's' : ''}
              </Text>
            )}
            {personOpSummary.deletes > 0 && (
              <Text size="sm" c="dimmed">
                • {personOpSummary.deletes} deletion
                {personOpSummary.deletes !== 1 ? 's' : ''}
              </Text>
            )}
          </Stack>
        )}

        {Object.entries(errors).map(([contactId, msg]) => {
          const contact = pendingChanges.find((c) => c.contactId === contactId)
          return (
            <Alert
              key={contactId}
              color="red"
              title={`Failed: ${contact?.contactName ?? contactId}`}
            >
              {msg}
            </Alert>
          )
        })}

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button color="orange" onClick={handleConfirm} loading={saving}>
            Confirm &amp; Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
