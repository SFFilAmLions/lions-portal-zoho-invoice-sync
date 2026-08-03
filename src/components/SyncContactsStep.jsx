import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  Divider,
  Group,
  Loader,
  Progress,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useZohoAuth } from '../hooks/useZohoAuth.jsx'
import { useDiffState } from '../hooks/useDiffState.js'
import {
  buildPayload,
  fetchAllContactsWithDetails,
  updateContact,
} from '../lib/zohoApi.js'

export default function SyncContactsStep({
  membersData,
  selectedOrgId,
  onComplete,
}) {
  const { accessToken, orgId: sessionOrgId, region } = useZohoAuth()
  const effectiveOrgId = selectedOrgId ?? sessionOrgId

  const [zohoContacts, setZohoContacts] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [upToDateOpen, upToDateHandlers] = useDisclosure(false)
  const [unmatchedOpen, unmatchedHandlers] = useDisclosure(false)

  const [committing, setCommitting] = useState(false)
  const [commitLog, setCommitLog] = useState([])
  const [commitDone, setCommitDone] = useState(false)

  const {
    matched,
    unmatched,
    upToDate,
    approveAll,
    approveDiff,
    skipDiff,
    approvedDiffs,
    selectedUnmatched,
    toggleUnmatched,
  } = useDiffState(membersData, zohoContacts)

  useEffect(() => {
    if (!accessToken || !effectiveOrgId || !region) return
    fetchAllContactsWithDetails(accessToken, effectiveOrgId, region)
      .then(setZohoContacts)
      .catch((e) => setLoadError(e.message))
  }, [accessToken, effectiveOrgId, region])

  const totalApproved = approvedDiffs.length + selectedUnmatched.size

  const handleCommit = async () => {
    setCommitting(true)
    const log = []

    const byContact = {}
    for (const diff of approvedDiffs) {
      if (!byContact[diff.contactId]) {
        byContact[diff.contactId] = { contact: diff.contact, dirtyFields: {} }
      }
      byContact[diff.contactId].dirtyFields[diff.fieldKey] = diff.csvValue
    }

    for (const { contact, dirtyFields } of Object.values(byContact)) {
      const name = `${contact.first_name} ${contact.last_name}`.trim()
      try {
        const payload = buildPayload(contact, dirtyFields)
        await updateContact(
          accessToken,
          effectiveOrgId,
          region,
          contact.contact_id,
          payload
        )
        log.push({ name, status: 'ok' })
      } catch (e) {
        log.push({ name, status: 'error', message: e.message })
      }
      setCommitLog([...log])
    }

    setCommitting(false)
    setCommitDone(true)
  }

  if (!zohoContacts && !loadError) {
    return (
      <Stack align="center" mt="xl" gap="md">
        <Loader />
        <Text>Loading Zoho contacts…</Text>
      </Stack>
    )
  }

  if (loadError) {
    return (
      <Alert color="red" title="Failed to load Zoho contacts">
        {loadError}
      </Alert>
    )
  }

  if (committing) {
    const total = Object.keys(
      approvedDiffs.reduce((acc, d) => ({ ...acc, [d.contactId]: 1 }), {})
    ).length
    return (
      <Stack gap="md" maw={640} mx="auto" mt="xl">
        <Title order={2}>Saving…</Title>
        <Progress
          value={total > 0 ? (commitLog.length / total) * 100 : 0}
          animated
        />
        <Stack gap={4}>
          {commitLog.map((entry, i) => (
            <Group key={i} gap="xs">
              <Text size="sm">{entry.status === 'ok' ? '✓' : '✕'}</Text>
              <Text size="sm">{entry.name}</Text>
              {entry.message && (
                <Text size="xs" c="red">
                  {entry.message}
                </Text>
              )}
            </Group>
          ))}
        </Stack>
      </Stack>
    )
  }

  if (commitDone) {
    const errors = commitLog.filter((l) => l.status === 'error')
    const successes = commitLog.filter((l) => l.status === 'ok')
    return (
      <Stack gap="md" maw={640} mx="auto" mt="xl">
        <Title order={2}>Sync Complete</Title>
        <Text>
          {successes.length} contact{successes.length !== 1 ? 's' : ''} updated.
        </Text>
        {errors.length > 0 && (
          <Alert color="red" title={`${errors.length} failed`}>
            {errors.map((e, i) => (
              <Text key={i} size="sm">
                {e.name}: {e.message}
              </Text>
            ))}
          </Alert>
        )}
        <Button onClick={onComplete}>Continue →</Button>
      </Stack>
    )
  }

  return (
    <Stack gap="lg" maw={800} mx="auto" mt="xl">
      <Group justify="space-between">
        <Title order={2}>Sync Contacts</Title>
        {matched.length > 0 && (
          <Button size="xs" variant="subtle" onClick={approveAll}>
            Approve All
          </Button>
        )}
      </Group>

      {matched.length === 0 && unmatched.length === 0 && (
        <Text c="dimmed">
          All {upToDate.length} members are already up to date in Zoho.
        </Text>
      )}

      {matched.length > 0 && (
        <Stack gap="xs">
          <Text fw={500}>
            {matched.reduce((n, m) => n + m.diffs.length, 0)} changes to review
            across {matched.length} members
          </Text>
          <Table striped withTableBorder fz="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Member</Table.Th>
                <Table.Th>Field</Table.Th>
                <Table.Th>Current (Zoho)</Table.Th>
                <Table.Th>New (LCI)</Table.Th>
                <Table.Th>Action</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {matched.flatMap(({ contact, diffs }) =>
                diffs.map((diff, i) => (
                  <Table.Tr
                    key={diff.id}
                    bg={
                      diff.approved === 'approved'
                        ? 'var(--mantine-color-green-0)'
                        : undefined
                    }
                  >
                    <Table.Td>
                      {i === 0
                        ? `${contact.first_name} ${contact.last_name}`
                        : ''}
                    </Table.Td>
                    <Table.Td>{diff.field}</Table.Td>
                    <Table.Td c="dimmed">{diff.zohoValue || '—'}</Table.Td>
                    <Table.Td>{diff.csvValue || '—'}</Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <Button
                          size="compact-xs"
                          color={
                            diff.approved === 'approved' ? 'green' : 'gray'
                          }
                          variant={
                            diff.approved === 'approved' ? 'filled' : 'outline'
                          }
                          onClick={() => approveDiff(diff.id)}
                        >
                          ✓
                        </Button>
                        <Button
                          size="compact-xs"
                          color={
                            diff.approved === 'skipped' ? 'orange' : 'gray'
                          }
                          variant={
                            diff.approved === 'skipped' ? 'filled' : 'outline'
                          }
                          onClick={() => skipDiff(diff.id)}
                        >
                          —
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Stack>
      )}

      {upToDate.length > 0 && (
        <Box>
          <Button variant="subtle" size="xs" onClick={upToDateHandlers.toggle}>
            {upToDate.length} members already up to date{' '}
            {upToDateOpen ? '▲' : '▼'}
          </Button>
          <Collapse in={upToDateOpen}>
            <Stack gap={2} mt="xs" pl="sm">
              {upToDate.map(({ contact }) => (
                <Text key={contact.contact_id} size="sm">
                  {contact.first_name} {contact.last_name}
                </Text>
              ))}
            </Stack>
          </Collapse>
        </Box>
      )}

      {unmatched.length > 0 && (
        <Box>
          <Button
            variant="subtle"
            size="xs"
            color="orange"
            onClick={unmatchedHandlers.toggle}
          >
            {unmatched.length} members not found in Zoho{' '}
            {unmatchedOpen ? '▲' : '▼'}
          </Button>
          <Collapse in={unmatchedOpen}>
            <Stack gap="xs" mt="xs" pl="sm">
              <Text size="xs" c="dimmed">
                Check &quot;Create&quot; to add these members as new Zoho
                contacts.
              </Text>
              {unmatched.map((row) => (
                <Checkbox
                  key={row.cf_member_id ?? `${row.first_name}_${row.last_name}`}
                  checked={selectedUnmatched.has(row.cf_member_id)}
                  onChange={() => toggleUnmatched(row.cf_member_id)}
                  label={`${row.first_name} ${row.last_name}${row.cf_member_id ? ` (ID: ${row.cf_member_id})` : ''}`}
                  size="sm"
                />
              ))}
            </Stack>
          </Collapse>
        </Box>
      )}

      <Divider />
      <Button onClick={handleCommit} disabled={totalApproved === 0}>
        Commit {totalApproved > 0 ? totalApproved : ''} change
        {totalApproved !== 1 ? 's' : ''} →
      </Button>
      {totalApproved === 0 && matched.length > 0 && (
        <Text size="xs" c="dimmed">
          Approve at least one change above to commit.
        </Text>
      )}
    </Stack>
  )
}
