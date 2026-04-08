import { useState } from 'react'
import {
  Button,
  Combobox,
  Group,
  InputBase,
  Table,
  TextInput,
  useCombobox,
} from '@mantine/core'
import { useCreateContactPerson } from '../hooks/useContactPersons.js'

function splitName(contactName) {
  if (!contactName) return { first_name: '', last_name: '' }
  const idx = contactName.indexOf(' ')
  if (idx === -1) return { first_name: '', last_name: contactName }
  return {
    first_name: contactName.slice(0, idx),
    last_name: contactName.slice(idx + 1),
  }
}

export default function AddContactPersonRow({ contactId, contacts, onCancel, colSpan }) {
  const { mutateAsync: createPerson, isPending } = useCreateContactPerson(contactId)
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  })

  const [search, setSearch] = useState('')
  const [fields, setFields] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
  })

  const filtered = (contacts ?? []).filter((c) =>
    c.contact_name.toLowerCase().includes(search.toLowerCase())
  )

  function handleSelect(contact) {
    const { first_name, last_name } = splitName(contact.contact_name)
    setFields({
      first_name,
      last_name,
      email: contact.email ?? '',
      phone: contact.phone ?? '',
      mobile: contact.mobile ?? '',
    })
    setSearch(contact.contact_name)
    combobox.closeDropdown()
  }

  function setField(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    await createPerson({
      first_name: fields.first_name,
      last_name: fields.last_name,
      email: fields.email,
      phone: fields.phone,
      mobile: fields.mobile,
    })
    onCancel()
  }

  return (
    <Table.Tr>
      <Table.Td colSpan={colSpan}>
        <Group gap="xs" align="flex-end" wrap="wrap">
          <Combobox
            store={combobox}
            onOptionSubmit={(val) => {
              const contact = contacts.find((c) => c.contact_id === val)
              if (contact) handleSelect(contact)
            }}
          >
            <Combobox.Target>
              <InputBase
                label="Customer"
                placeholder="Search…"
                size="xs"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  combobox.openDropdown()
                }}
                onFocus={() => combobox.openDropdown()}
                onBlur={() => combobox.closeDropdown()}
                rightSection={<Combobox.Chevron />}
                rightSectionPointerEvents="none"
                style={{ minWidth: 180 }}
              />
            </Combobox.Target>
            <Combobox.Dropdown>
              <Combobox.Options>
                {filtered.length === 0 ? (
                  <Combobox.Empty>No customers found</Combobox.Empty>
                ) : (
                  filtered.map((c) => (
                    <Combobox.Option key={c.contact_id} value={c.contact_id}>
                      {c.contact_name}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </Combobox.Dropdown>
          </Combobox>

          <TextInput label="First Name" size="xs" style={{ width: 100 }} value={fields.first_name} onChange={(e) => setField('first_name', e.target.value)} />
          <TextInput label="Last Name" size="xs" style={{ width: 100 }} value={fields.last_name} onChange={(e) => setField('last_name', e.target.value)} />
          <TextInput label="Email" size="xs" style={{ width: 160 }} value={fields.email} onChange={(e) => setField('email', e.target.value)} />
          <TextInput label="Phone" size="xs" style={{ width: 100 }} value={fields.phone} onChange={(e) => setField('phone', e.target.value)} />
          <TextInput label="Mobile" size="xs" style={{ width: 100 }} value={fields.mobile} onChange={(e) => setField('mobile', e.target.value)} />

          <Group gap={4} align="flex-end" style={{ paddingBottom: 1 }}>
            <Button size="compact-xs" color="orange" onClick={handleSave} loading={isPending}>
              Save
            </Button>
            <Button size="compact-xs" variant="default" onClick={onCancel}>
              Cancel
            </Button>
          </Group>
        </Group>
      </Table.Td>
    </Table.Tr>
  )
}
