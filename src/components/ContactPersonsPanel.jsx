import { Button, Table, Text } from '@mantine/core'
import { useContactPersons } from '../hooks/useContactPersons.js'

export default function ContactPersonsPanel({ contactId }) {
  const { data: persons, isLoading } = useContactPersons(contactId)

  return (
    <div style={{ padding: '0.5rem 1rem 0.75rem 2.5rem' }}>
      <Text size="xs" fw={600} c="dimmed" mb={6}>
        Contact Persons
      </Text>
      {isLoading ? (
        <Text size="xs" c="dimmed">
          Loading…
        </Text>
      ) : !persons?.length ? (
        <Text size="xs" c="dimmed">
          No contact persons.{' '}
          <Button variant="subtle" size="compact-xs" disabled>
            + Add
          </Button>
        </Text>
      ) : (
        <Table fz="xs" withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>First Name</Table.Th>
              <Table.Th>Last Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Mobile</Table.Th>
              <Table.Th>Primary</Table.Th>
              <Table.Th>Notify</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {persons.map((p) => (
              <Table.Tr key={p.contact_person_id}>
                <Table.Td>{p.first_name}</Table.Td>
                <Table.Td>{p.last_name}</Table.Td>
                <Table.Td>{p.email}</Table.Td>
                <Table.Td>{p.phone}</Table.Td>
                <Table.Td>{p.mobile}</Table.Td>
                <Table.Td>{p.is_primary_contact ? '★' : ''}</Table.Td>
                <Table.Td>{p.enable_portal ? '✓' : ''}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </div>
  )
}
