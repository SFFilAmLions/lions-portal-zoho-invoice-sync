import { Alert, Button, Stack, Text, Title } from '@mantine/core'

export default function AnnualDuesStep({ onComplete }) {
  return (
    <Stack gap="lg" maw={640} mx="auto" mt="xl">
      <Title order={2}>Annual Dues</Title>
      <Alert color="blue" title="Coming in Phase 2">
        <Text>
          This step will create new annual dues invoices for each member,
          pulling line items from your existing Zoho items, and carrying forward
          any unpaid balances.
        </Text>
      </Alert>
      <Button onClick={onComplete}>Finish</Button>
    </Stack>
  )
}
