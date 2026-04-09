import { useState } from 'react'
import {
  Alert,
  Button,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
  Tooltip,
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
 *   onConfirm    {(onProgress: (contactId, status, error?) => void) => Promise<void>}
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
  // { [contactId]: 'saving' | 'success' | 'error' }
  const [rowStatus, setRowStatus] = useState({})
  // { [contactId]: string }
  const [rowErrors, setRowErrors] = useState({})

  function handleProgress(contactId, status, error) {
    setRowStatus((prev) => ({ ...prev, [contactId]: status }))
    if (status === 'error' && error) {
      setRowErrors((prev) => ({
        ...prev,
        [contactId]: error.message ?? String(error),
      }))
    }
  }

  // Collect errors locally during the call (state updates are async so we can't
  // reliably read rowErrors right after onConfirm resolves).
  async function handleConfirmTracked() {
    setSaving(true)
    setRowStatus({})
    setRowErrors({})
    const localErrors = {}
    function trackedProgress(contactId, status, error) {
      handleProgress(contactId, status, error)
      if (status === 'error' && error) {
        localErrors[contactId] = error.message ?? String(error)
      }
    }
    try {
      await onConfirm(trackedProgress)
      if (Object.keys(localErrors).length === 0) {
        onClose()
      }
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    if (saving) return
    setRowStatus({})
    setRowErrors({})
    onClose()
  }

  const hasErrors = Object.keys(rowErrors).length > 0

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
              <Table.Th w={32}></Table.Th>
              <Table.Th>Contact</Table.Th>
              <Table.Th>Field</Table.Th>
              <Table.Th>Original</Table.Th>
              <Table.Th>New value</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pendingChanges.map((change, i) => {
              const status = rowStatus[change.contactId]
              const errMsg = rowErrors[change.contactId]
              return (
                <Table.Tr
                  key={i}
                  style={
                    status === 'error'
                      ? { backgroundColor: '#fff1f2' }
                      : status === 'success'
                        ? { backgroundColor: '#f0fdf4' }
                        : undefined
                  }
                >
                  <Table.Td ta="center" py={2}>
                    <StatusIcon status={status} errorMsg={errMsg} />
                  </Table.Td>
                  <Table.Td>{change.contactName}</Table.Td>
                  <Table.Td>{change.field}</Table.Td>
                  <Table.Td c="dimmed">{change.original}</Table.Td>
                  <Table.Td fw={500}>{change.newValue}</Table.Td>
                </Table.Tr>
              )
            })}
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
                &bull; {personOpSummary.edits} field edit
                {personOpSummary.edits !== 1 ? 's' : ''}
              </Text>
            )}
            {personOpSummary.adds > 0 && (
              <Text size="sm" c="dimmed">
                &bull; {personOpSummary.adds} addition
                {personOpSummary.adds !== 1 ? 's' : ''}
              </Text>
            )}
            {personOpSummary.deletes > 0 && (
              <Text size="sm" c="dimmed">
                &bull; {personOpSummary.deletes} deletion
                {personOpSummary.deletes !== 1 ? 's' : ''}
              </Text>
            )}
          </Stack>
        )}

        {hasErrors && (
          <Alert color="red" title="Some changes failed to save">
            Failed rows are highlighted above. Fix the issue or retry — only
            failed edits remain in the queue.
          </Alert>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={handleClose} disabled={saving}>
            {hasErrors ? 'Close' : 'Cancel'}
          </Button>
          <Button
            color="orange"
            onClick={handleConfirmTracked}
            loading={saving}
          >
            {hasErrors ? 'Retry failed' : 'Confirm \u0026 Save'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

function StatusIcon({ status, errorMsg }) {
  if (!status) return null
  if (status === 'saving') {
    return <Loader size={14} />
  }
  if (status === 'success') {
    return (
      <span
        style={{ color: '#2f9e44', fontWeight: 700, fontSize: 14 }}
        aria-label="Saved"
      >
        ✓
      </span>
    )
  }
  if (status === 'error') {
    return (
      <Tooltip label={errorMsg ?? 'Error'} withArrow>
        <span
          style={{
            color: '#e03131',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'help',
          }}
          aria-label="Failed"
        >
          ✕
        </span>
      </Tooltip>
    )
  }
  return null
}
