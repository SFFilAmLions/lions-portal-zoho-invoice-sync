import { useEffect, useState } from 'react'
import { Button, Select, Stack, Text, Title } from '@mantine/core'
import { useZohoAuth } from '../hooks/useZohoAuth.jsx'

const AUTH_RETURN_KEY = 'wizard_returning_from_auth'

const REGIONS = [
  { value: 'com', label: 'United States (zoho.com)' },
  { value: 'eu', label: 'Europe (zoho.eu)' },
  { value: 'in', label: 'India (zoho.in)' },
  { value: 'com.au', label: 'Australia (zoho.com.au)' },
  { value: 'jp', label: 'Japan (zoho.jp)' },
]

export default function ConnectZohoStep({
  onComplete,
  selectedOrgId,
  onOrgSelected,
}) {
  const { isAuthenticated, region, orgs, login, logout } = useZohoAuth()
  const [localRegion, setLocalRegion] = useState(
    () => localStorage.getItem('zoho-region') ?? region ?? 'com'
  )

  // Auto-complete if only one org (most clubs will have exactly one)
  useEffect(() => {
    if (!isAuthenticated || !orgs.length) return
    if (orgs.length === 1) {
      onOrgSelected(orgs[0].organization_id)
      onComplete()
    } else if (selectedOrgId) {
      // User already picked one in a previous visit to this step
      onComplete()
    }
  }, [isAuthenticated, orgs]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = () => {
    localStorage.setItem('zoho-region', localRegion)
    sessionStorage.setItem(AUTH_RETURN_KEY, '1')
    login(localRegion)
  }

  const handleOrgConfirm = () => {
    if (selectedOrgId) onComplete()
  }

  if (!isAuthenticated) {
    return (
      <Stack gap="lg" maw={480} mx="auto" mt="xl">
        <Title order={2}>Connect to Zoho Invoice</Title>
        <Select
          label="Region"
          data={REGIONS}
          value={localRegion}
          onChange={(v) => {
            setLocalRegion(v)
            localStorage.setItem('zoho-region', v)
          }}
        />
        <Button onClick={handleConnect}>Connect to Zoho Invoice</Button>
      </Stack>
    )
  }

  // Multiple orgs — let user pick
  if (orgs.length > 1 && !selectedOrgId) {
    return (
      <Stack gap="lg" maw={480} mx="auto" mt="xl">
        <Title order={2}>Select Organization</Title>
        <Select
          label="Organization"
          placeholder="Select your Lions club"
          data={orgs.map((o) => ({ value: o.organization_id, label: o.name }))}
          value={selectedOrgId ?? null}
          onChange={onOrgSelected}
        />
        <Button onClick={handleOrgConfirm} disabled={!selectedOrgId}>
          Continue →
        </Button>
        <Button variant="subtle" color="gray" size="xs" onClick={logout}>
          Sign out and use a different account
        </Button>
      </Stack>
    )
  }

  // Authenticated, loading orgs
  return (
    <Stack align="center" mt="xl" gap="md">
      <Text>Completing sign-in…</Text>
    </Stack>
  )
}
