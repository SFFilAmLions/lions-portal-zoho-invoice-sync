import { useState } from 'react'
import { useZohoAuth } from '../hooks/useZohoAuth.js'
import { Button, Center, Paper, Select, Stack, Text, Title } from '@mantine/core'

const REGIONS = [
  { value: 'com', label: 'Global (US)' },
  { value: 'eu', label: 'Europe' },
  { value: 'in', label: 'India' },
  { value: 'com.au', label: 'Australia' },
  { value: 'jp', label: 'Japan' },
]

export default function LoginPage() {
  const { login } = useZohoAuth()
  const [region, setRegion] = useState('com')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLogin() {
    setLoading(true)
    setError(null)
    try {
      await login(region)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <Center mih="100vh" bg="gray.1">
      <Paper w={320} p="xl" radius="md" shadow="sm">
        <Stack gap="sm">
          <Title order={1} size="h3" c="#e0440e">Zoho Invoice</Title>
          <Text size="md" c="dimmed" fw={400}>Customer Editor</Text>

          <Select
            label="Zoho region"
            value={region}
            onChange={setRegion}
            disabled={loading}
            data={REGIONS}
            allowDeselect={false}
          />

          {error && <Text size="sm" c="red">{error}</Text>}

          <Button mt="xs" fullWidth color="#e0440e" onClick={handleLogin} disabled={loading}>
            {loading ? 'Redirecting…' : 'Connect to Zoho Invoice'}
          </Button>
        </Stack>
      </Paper>
    </Center>
  )
}
