import { useEffect, useRef, useState, useCallback } from 'react'
import Papa from 'papaparse'
import {
  Alert,
  Button,
  Group,
  Modal,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
} from '@mantine/core'
import {
  STANDARD_ZOHO_FIELDS,
  applyMapping,
  initialMapping,
  loadSavedMatchKey,
  saveMapping,
  saveMatchKey,
} from '../lib/csvImport.js'

/**
 * CsvImportModal — two-step CSV import: upload → column mapping → apply.
 *
 * Props:
 *   opened          {boolean}
 *   onClose         {() => void}
 *   contacts        {Object[]}  — currently loaded Zoho contacts
 *   customFields    {Array<{api_name, label}>}  — from first contact
 *   onApply         {(dirtyMap: Object) => void}
 */
export default function CsvImportModal({
  opened,
  onClose,
  contacts,
  customFields,
  onApply,
}) {
  const fileInputRef = useRef(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Step: 'upload' | 'mapping'
  const [step, setStep] = useState('upload')

  // Parsed CSV state
  const [csvHeaders, setCsvHeaders] = useState([])
  const [csvRows, setCsvRows] = useState([])
  const [parseError, setParseError] = useState(null)

  // Column mapping: { [csvHeader]: zohoFieldId | '__ignore__' }
  const [mapping, setMapping] = useState({})

  // Match key config
  const [matchCsvHeader, setMatchCsvHeader] = useState(null)
  const [matchZohoField, setMatchZohoField] = useState(null)

  // Result after applying
  const [applyResult, setApplyResult] = useState(null) // { matchedCount, unmatchedCount }

  // Reset state when modal opens
  useEffect(() => {
    if (opened) {
      setStep('upload')
      setCsvHeaders([])
      setCsvRows([])
      setParseError(null)
      setMapping({})
      setApplyResult(null)
      // Restore saved match key
      const saved = loadSavedMatchKey()
      if (saved) {
        setMatchCsvHeader(saved.csvHeader ?? null)
        setMatchZohoField(saved.zohoField ?? null)
      } else {
        setMatchCsvHeader(null)
        setMatchZohoField(null)
      }
    }
  }, [opened])

  // Zoho field options for the mapping dropdowns
  const zohoFieldOptions = [
    { value: '__ignore__', label: 'Ignore' },
    ...STANDARD_ZOHO_FIELDS,
    ...(customFields ?? []).map((cf) => ({
      value: cf.api_name,
      label: cf.label ?? cf.api_name,
    })),
  ]

  const parseFile = useCallback((file) => {
    setParseError(null)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0 && result.data.length === 0) {
          setParseError(result.errors[0].message)
          return
        }
        const headers = result.meta.fields ?? []
        setCsvHeaders(headers)
        setCsvRows(result.data)
        const m = initialMapping(headers)
        setMapping(m)

        // Auto-select match key if saved one is present in this file's headers
        const saved = loadSavedMatchKey()
        if (saved && headers.includes(saved.csvHeader)) {
          setMatchCsvHeader(saved.csvHeader)
          setMatchZohoField(saved.zohoField)
        }

        setStep('mapping')
      },
      error: (err) => {
        setParseError(err.message)
      },
    })
  }, [])

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    parseFile(file)
    // Reset file input so the same file can be re-selected
    e.target.value = ''
  }

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e) {
    // Only clear if leaving the drop zone entirely (not entering a child element)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setParseError('Please drop a CSV file.')
      return
    }
    parseFile(file)
  }

  function handleMappingChange(csvHeader, zohoField) {
    setMapping((prev) => ({ ...prev, [csvHeader]: zohoField }))
  }

  function handleMatchCsvHeaderChange(val) {
    setMatchCsvHeader(val)
    // Auto-fill the Zoho match field from the current column mapping
    const mapped = mapping[val]
    if (mapped && mapped !== '__ignore__') {
      setMatchZohoField(mapped)
    }
  }

  function handleApply() {
    if (!matchCsvHeader || !matchZohoField) return

    saveMapping(mapping)
    saveMatchKey(matchCsvHeader, matchZohoField)

    const { dirtyMap, matchedCount, unmatchedCount } = applyMapping(
      csvRows,
      mapping,
      matchCsvHeader,
      matchZohoField,
      contacts
    )

    setApplyResult({ matchedCount, unmatchedCount })

    if (unmatchedCount > 0 && matchedCount === 0) {
      // Nothing matched — show warning, don't close yet
      return
    }

    onApply(dirtyMap)
    onClose()
  }

  // Example value for a CSV header (first non-empty row)
  function exampleValue(header) {
    for (const row of csvRows) {
      const v = row[header]
      if (v != null && String(v).trim() !== '') return String(v).trim()
    }
    return ''
  }

  const canApply = matchCsvHeader && matchZohoField

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Import from CSV"
      size="xl"
      scrollAreaComponent={ScrollArea.Autosize}
    >
      {step === 'upload' && (
        <Stack gap="md">
          {parseError && (
            <Alert color="red" title="Parse error">
              {parseError}
            </Alert>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragOver ? '#228be6' : '#ced4da'}`,
              borderRadius: 8,
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragOver ? '#e7f5ff' : undefined,
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <Text size="sm" fw={500} mb={4}>
              {isDragOver
                ? 'Drop CSV file here'
                : 'Drop a CSV file here, or click to browse'}
            </Text>
            <Text size="xs" c="dimmed">
              Headers will be mapped to Zoho contact fields automatically where
              possible.
            </Text>
          </div>
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
          </Group>
        </Stack>
      )}

      {step === 'mapping' && (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {csvRows.length} rows loaded. Map CSV columns to Zoho fields below,
            then choose the column used to identify each contact.
          </Text>

          {/* Match key config */}
          <Stack gap={4}>
            <Text size="sm" fw={600}>
              Match key
            </Text>
            <Text size="xs" c="dimmed">
              Which CSV column uniquely identifies a contact, and which Zoho
              field to compare it against?
            </Text>
            <Group gap="sm" align="flex-end">
              <Select
                label="CSV column"
                placeholder="Select…"
                size="xs"
                w={240}
                value={matchCsvHeader}
                onChange={handleMatchCsvHeaderChange}
                data={csvHeaders}
                searchable
              />
              <Select
                label="Zoho field"
                placeholder="Select…"
                size="xs"
                w={200}
                value={matchZohoField}
                onChange={setMatchZohoField}
                data={zohoFieldOptions.filter((o) => o.value !== '__ignore__')}
                searchable
              />
            </Group>
          </Stack>

          {/* Column mapping table */}
          <Table fz="xs" withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>CSV Column</Table.Th>
                <Table.Th>Example Value</Table.Th>
                <Table.Th>→ Zoho Field</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {csvHeaders.map((header) => (
                <Table.Tr key={header}>
                  <Table.Td>
                    <Text size="xs">{header}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {exampleValue(header)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Select
                      size="xs"
                      value={mapping[header] ?? '__ignore__'}
                      onChange={(val) =>
                        val && handleMappingChange(header, val)
                      }
                      data={zohoFieldOptions}
                      allowDeselect={false}
                      comboboxProps={{ withinPortal: true }}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {applyResult && applyResult.unmatchedCount > 0 && (
            <Alert
              color={applyResult.matchedCount === 0 ? 'red' : 'yellow'}
              title="Unmatched rows"
            >
              {applyResult.unmatchedCount} row
              {applyResult.unmatchedCount !== 1 ? 's' : ''} could not be matched
              to a Zoho contact.
              {applyResult.matchedCount === 0
                ? ' No contacts were updated. Check your match key configuration.'
                : ' Matched rows have been applied.'}
            </Alert>
          )}

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button color="orange" onClick={handleApply} disabled={!canApply}>
              Apply mapping
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
