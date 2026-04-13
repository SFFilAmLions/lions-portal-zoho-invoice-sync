import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  Paper,
  Progress,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core'

const ADDRESS_FIELDS = new Set([
  'address',
  'billing_city',
  'billing_state',
  'billing_zip',
  'billing_country',
])

/**
 * CommitModal — lists all pending changes grouped per contact and confirms save.
 *
 * Props:
 *   opened       {boolean}
 *   onClose      {() => void}       called when modal should close (cancel or done)
 *   pendingChanges {Array<{
 *     contactId: string,
 *     contactName: string,
 *     fieldId: string,
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
  // Ordered log of completed contacts: [{ contactName, status, errorMsg? }]
  const [logEntries, setLogEntries] = useState([])

  // Group pendingChanges by contactId
  const grouped = useMemo(() => {
    const map = new Map()
    for (const change of pendingChanges) {
      if (!map.has(change.contactId)) {
        map.set(change.contactId, {
          contactId: change.contactId,
          contactName: change.contactName,
          fields: [],
        })
      }
      map.get(change.contactId).fields.push(change)
    }
    return Array.from(map.values())
  }, [pendingChanges])

  // Total unique contacts to save (for progress bar)
  const totalContacts = grouped.length

  const completed = Object.values(rowStatus).filter(
    (s) => s === 'success' || s === 'error'
  ).length
  const progressValue =
    totalContacts > 0 ? Math.round((completed / totalContacts) * 100) : 0
  const hasErrors = Object.keys(rowErrors).length > 0
  const showProgress = saving || completed > 0

  // Collect errors locally during the call (state updates are async so we can't
  // reliably read rowErrors right after onConfirm resolves).
  async function handleConfirmTracked() {
    setSaving(true)
    setRowStatus({})
    setRowErrors({})
    setLogEntries([])
    const localErrors = {}

    function trackedProgress(contactId, status, error) {
      setRowStatus((prev) => ({ ...prev, [contactId]: status }))
      if (status === 'error' && error) {
        const msg = error.message ?? String(error)
        setRowErrors((prev) => ({ ...prev, [contactId]: msg }))
        localErrors[contactId] = msg
      }
      if (status === 'success' || status === 'error') {
        const name =
          pendingChanges.find((c) => c.contactId === contactId)?.contactName ??
          contactId
        setLogEntries((prev) => [
          ...prev,
          {
            contactName: name,
            status,
            errorMsg:
              status === 'error'
                ? (error?.message ?? String(error))
                : undefined,
          },
        ])
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
    setLogEntries([])
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Confirm changes"
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      <Stack gap="md">
        {!showProgress && (
          <Text size="sm" c="dimmed">
            Review the pending changes below. Click &ldquo;Confirm &amp;
            Save&rdquo; to write them to Zoho.
          </Text>
        )}

        {showProgress && (
          <Stack gap={6}>
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                {saving
                  ? 'Saving…'
                  : hasErrors
                    ? 'Completed with errors'
                    : 'All changes saved'}
              </Text>
              <Text size="sm" c="dimmed">
                {completed} / {totalContacts}
              </Text>
            </Group>
            <Progress
              value={progressValue}
              color={saving ? 'orange' : hasErrors ? 'red' : 'green'}
              animated={saving}
              size="sm"
            />
          </Stack>
        )}

        {logEntries.length > 0 && (
          <Stack gap={2}>
            {logEntries.map((entry, i) => (
              <Group key={i} gap={6} align="center">
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: entry.status === 'success' ? '#2f9e44' : '#e03131',
                    flexShrink: 0,
                  }}
                >
                  {entry.status === 'success' ? '✓' : '✕'}
                </span>
                <Text size="sm">
                  {entry.contactName}
                  {entry.errorMsg && (
                    <Text span c="red" size="sm">
                      {' '}
                      — {entry.errorMsg}
                    </Text>
                  )}
                </Text>
              </Group>
            ))}
            {saving && (
              <Group gap={6} align="center">
                <Loader size={12} />
                <Text size="sm" c="dimmed">
                  Saving…
                </Text>
              </Group>
            )}
          </Stack>
        )}

        {/* Per-contact change cards */}
        <Stack gap="sm">
          {grouped.map(({ contactId, contactName, fields }) => {
            const status = rowStatus[contactId]
            const errMsg = rowErrors[contactId]
            const addressFields = fields.filter((f) =>
              ADDRESS_FIELDS.has(f.fieldId)
            )
            const otherFields = fields.filter(
              (f) => !ADDRESS_FIELDS.has(f.fieldId)
            )
            return (
              <Paper
                key={contactId}
                withBorder
                p="sm"
                style={
                  status === 'error'
                    ? { borderColor: '#e03131', backgroundColor: '#fff1f2' }
                    : status === 'success'
                      ? { borderColor: '#2f9e44', backgroundColor: '#f0fdf4' }
                      : undefined
                }
              >
                {/* Card header: contact name + status icon */}
                <Group
                  justify="space-between"
                  mb={
                    otherFields.length > 0 || addressFields.length > 0 ? 6 : 0
                  }
                >
                  <Text size="sm" fw={600}>
                    {contactName}
                  </Text>
                  <StatusIcon status={status} errorMsg={errMsg} />
                </Group>

                {/* Non-address fields */}
                {otherFields.map((change) => (
                  <FieldRow key={change.fieldId} change={change} />
                ))}

                {/* Address fields grouped */}
                {addressFields.length > 0 && (
                  <Box mt={otherFields.length > 0 ? 4 : 0}>
                    <Text size="xs" fw={600} c="dimmed" mb={2}>
                      Billing Address
                    </Text>
                    <Box pl="md">
                      {addressFields.map((change) => (
                        <FieldRow key={change.fieldId} change={change} />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            )
          })}
        </Stack>

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
            Failed contacts are highlighted above. Fix the issue or retry — only
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

function FieldRow({ change }) {
  return (
    <Group gap={8} py={1} wrap="nowrap">
      <Text size="xs" c="dimmed" style={{ minWidth: 100, flexShrink: 0 }}>
        {change.field}
      </Text>
      {change.original ? (
        <>
          <Text
            size="xs"
            c="dimmed"
            style={{
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {change.original}
          </Text>
          <Text size="xs" c="dimmed">
            →
          </Text>
        </>
      ) : (
        <Text size="xs" c="dimmed">
          →
        </Text>
      )}
      <Text
        size="xs"
        fw={500}
        style={{
          maxWidth: 220,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {change.newValue || (
          <Text span c="dimmed" fs="italic">
            empty
          </Text>
        )}
      </Text>
    </Group>
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
