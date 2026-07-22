import { useEffect, useState } from 'react'
import {
  AppShell,
  Button,
  Container,
  Group,
  Stepper,
  Title,
} from '@mantine/core'
import { useZohoAuth } from '../hooks/useZohoAuth.jsx'
import MembersListStep from './MembersListStep.jsx'
import ConnectZohoStep from './ConnectZohoStep.jsx'
import SyncContactsStep from './SyncContactsStep.jsx'
import InvoiceStatusStep from './InvoiceStatusStep.jsx'
import AnnualDuesStep from './AnnualDuesStep.jsx'

const MEMBERS_CACHE_KEY = 'lci-members-cache'
const AUTH_RETURN_KEY = 'wizard_returning_from_auth'

const STEP_LABELS = [
  { label: 'Members List', description: 'Upload LCI roster' },
  { label: 'Connect to Zoho', description: 'Auth + select org' },
  { label: 'Sync Contacts', description: 'Review & commit' },
  { label: 'Invoice Status', description: 'Open invoices' },
  { label: 'Annual Dues', description: 'Create invoices' },
]

function loadCachedMembers() {
  try {
    const raw = localStorage.getItem(MEMBERS_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function WizardShell() {
  const { isAuthenticated } = useZohoAuth()
  const [activeStep, setActiveStep] = useState(0)
  const [highestUnlocked, setHighestUnlocked] = useState(0)
  const [membersData, setMembersData] = useState(() => loadCachedMembers())
  const [selectedOrgId, setSelectedOrgId] = useState(null)

  // On mount: restore step after OAuth redirect, and unlock steps based on existing state
  useEffect(() => {
    const cachedMembers = loadCachedMembers()
    let unlocked = 0

    if (cachedMembers) {
      if (!membersData) setMembersData(cachedMembers)
      unlocked = Math.max(unlocked, 1)
    }

    if (isAuthenticated && unlocked >= 1) {
      unlocked = Math.max(unlocked, 2)
    }

    setHighestUnlocked(unlocked)

    // If returning from OAuth redirect, jump back to step 2
    if (sessionStorage.getItem(AUTH_RETURN_KEY) === '1') {
      sessionStorage.removeItem(AUTH_RETURN_KEY)
      setActiveStep(1)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStepClick = (step) => {
    if (step <= highestUnlocked) setActiveStep(step)
  }

  const handleComplete = (stepIndex, data) => {
    if (stepIndex === 0 && data) setMembersData(data)
    const next = stepIndex + 1
    setHighestUnlocked((h) => Math.max(h, next))
    if (next < STEP_LABELS.length) setActiveStep(next)
  }

  const handleStartOver = () => {
    setActiveStep(0)
    setHighestUnlocked(membersData ? 1 : 0)
    // Auth token is intentionally preserved; members cache is intentionally preserved
  }

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return (
          <MembersListStep onComplete={(data) => handleComplete(0, data)} />
        )
      case 1:
        return (
          <ConnectZohoStep
            onComplete={() => handleComplete(1)}
            selectedOrgId={selectedOrgId}
            onOrgSelected={setSelectedOrgId}
          />
        )
      case 2:
        return (
          <SyncContactsStep
            membersData={membersData}
            selectedOrgId={selectedOrgId}
            onComplete={() => handleComplete(2)}
          />
        )
      case 3:
        return <InvoiceStatusStep onComplete={() => handleComplete(3)} />
      case 4:
        return <AnnualDuesStep onComplete={handleStartOver} />
      default:
        return null
    }
  }

  return (
    <AppShell header={{ height: 130 }} padding="md">
      <AppShell.Header p="md">
        <Group justify="space-between" mb="xs">
          <Title order={3}>Lions Portal</Title>
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            onClick={handleStartOver}
          >
            Start Over
          </Button>
        </Group>
        <Stepper active={activeStep} onStepClick={handleStepClick} size="xs">
          {STEP_LABELS.map(({ label, description }) => (
            <Stepper.Step key={label} label={label} description={description} />
          ))}
        </Stepper>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg" py="xl">
          {renderStep()}
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
