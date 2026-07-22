import { Alert, Button, Stack, Text, Title } from '@mantine/core'

export default function InvoiceStatusStep({ onComplete }) {
  return (
    <Stack gap="lg" maw={640} mx="auto" mt="xl">
      <Title order={2}>Invoice Status</Title>
      <Alert color="blue" title="Coming in Phase 2">
        <Text>
          This step will load open invoices for each member and show who has
          outstanding balances from prior years.
        </Text>
      </Alert>
      <Button onClick={onComplete}>Continue →</Button>
    </Stack>
  )
}
