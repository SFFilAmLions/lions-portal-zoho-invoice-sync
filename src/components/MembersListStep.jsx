import { useRef, useState } from 'react'
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { MEMBERS_CACHE_KEY } from './WizardShell.jsx'

const CACHE_KEY = MEMBERS_CACHE_KEY

const LCI_FIELD_MAP = {
  'Member ID': 'cf_member_id',
  'First Name': 'first_name',
  'Last Name': 'last_name',
  Email: 'email',
  Phone: 'phone',
  'Cell Phone': 'mobile',
  'Address 1': 'address',
  City: 'billing_city',
  'State/Province': 'billing_state',
  'Postal Code': 'billing_zip',
  Country: 'billing_country',
  'Member Type': 'cf_member_type',
}

function parseCsvLine(line) {
  // Handles quoted fields containing commas
  const result = []
  let current = ''
  let inQuotes = false
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseLciCsv(text, fileName) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2)
    throw new Error('CSV appears empty or has no data rows.')

  const headers = parseCsvLine(lines[0])
  const rows = lines
    .slice(1)
    .map((line) => {
      const values = parseCsvLine(line)
      const raw = Object.fromEntries(
        headers.map((h, i) => [h, values[i] ?? ''])
      )
      const mapped = {}
      for (const [lciCol, zohoField] of Object.entries(LCI_FIELD_MAP)) {
        if (raw[lciCol] !== undefined) mapped[zohoField] = raw[lciCol]
      }
      return mapped
    })
    .filter((row) => Object.values(row).some(Boolean)) // skip blank rows

  const hasMemberId = rows.some((r) => r.cf_member_id)
  if (!hasMemberId) {
    throw new Error(
      "Column 'Member ID' not found — is this an LCI export? " +
        `Detected headers: ${headers.slice(0, 5).join(', ')}…`
    )
  }

  return { rows, fileName, cachedAt: new Date().toISOString() }
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function MembersListStep({ onComplete }) {
  const [parseError, setParseError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef()
  const cache = loadCache()

  const handleFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setParseError('Please select a .csv file.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = parseLciCsv(e.target.result, file.name)
        setParseError(null)
        setPreview(data)
      } catch (err) {
        setParseError(err.message)
        setPreview(null)
      }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleContinueWithPreview = () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(preview))
    onComplete(preview)
  }

  const handleUseCache = () => {
    onComplete(cache)
  }

  return (
    <Stack gap="lg" maw={640} mx="auto" mt="xl">
      <Title order={2}>Members List</Title>
      <Text c="dimmed">
        Upload your Lions International member roster from MyLCI, or reuse a
        previously uploaded list.
      </Text>

      {cache && (
        <Card withBorder p="md">
          <Group justify="space-between">
            <Stack gap={4}>
              <Group gap="xs">
                <Text fw={500}>{cache.fileName}</Text>
                <Badge size="sm" color="blue">
                  {cache.rows.length} members
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Cached {new Date(cache.cachedAt).toLocaleDateString()}
              </Text>
            </Stack>
            <Button size="sm" onClick={handleUseCache}>
              Use this list
            </Button>
          </Group>
        </Card>
      )}

      <Box
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-4)'}`,
          borderRadius: 8,
          padding: 40,
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'var(--mantine-color-blue-0)' : undefined,
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
        <Text size="xl" mb="xs">
          📂
        </Text>
        <Text>Drop your LCI export here, or click to browse</Text>
        <Text size="xs" c="dimmed" mt={4}>
          Export from MyLCI → Reports → Member List → Download as CSV
        </Text>
      </Box>

      {parseError && (
        <Alert color="red" title="Could not parse CSV">
          {parseError}
        </Alert>
      )}

      {preview && (
        <Card withBorder p="md">
          <Group justify="space-between">
            <Stack gap={4}>
              <Text fw={500}>{preview.fileName}</Text>
              <Badge color="green">
                {preview.rows.length} members detected
              </Badge>
            </Stack>
            <Button onClick={handleContinueWithPreview}>Continue →</Button>
          </Group>
        </Card>
      )}
    </Stack>
  )
}
