import { Grid, Stack, Text } from '@mantine/core'
import EditableCell from './EditableCell.jsx'
import { getContactFieldValue } from '../lib/csvImport.js'

/** Render a labeled field using EditableCell's fake-context pattern. */
function FieldCell({ label, fieldId, contact, defaultType, meta }) {
  return (
    <Stack gap={2}>
      <Text size="xs" fw={500} c="dimmed">
        {label}
      </Text>
      <EditableCell
        getValue={() => getContactFieldValue(contact, fieldId)}
        row={{ original: contact }}
        column={{ id: fieldId, columnDef: { meta: { defaultType } } }}
        table={{ options: { meta } }}
      />
    </Stack>
  )
}

function SectionHeading({ children }) {
  return (
    <Text
      size="xs"
      fw={700}
      tt="uppercase"
      c="dimmed"
      style={{
        letterSpacing: '0.05em',
        borderBottom: '1px solid #e9ecef',
        paddingBottom: 4,
      }}
    >
      {children}
    </Text>
  )
}

/**
 * ContactDetailPanel — grouped form showing all editable contact fields.
 *
 * Displayed in the expanded row below the table row, above ContactPersonsPanel.
 *
 * Props passed through to EditableCell via fake table meta:
 *   isEditMode, isDirty, getDirtyValue, markDirty, clearDirty,
 *   setValidationError, clearValidationError, getColType, getEnumValues
 */
export default function ContactDetailPanel({
  contact,
  isEditMode,
  isDirty,
  getDirtyValue,
  markDirty,
  clearDirty,
  setValidationError,
  clearValidationError,
  getColType,
  getEnumValues,
}) {
  const meta = {
    isEditMode,
    isDirty,
    getDirtyValue,
    markDirty,
    clearDirty,
    setValidationError,
    clearValidationError,
    getColType,
    getEnumValues,
  }

  const customFields = contact.custom_fields ?? []

  /** Resolve defaultType for a custom field */
  function cfDefaultType(cf) {
    if (cf.data_type === 'dropdown') return 'enum'
    return 'text'
  }

  return (
    <Stack gap="sm" p="md" style={{ borderBottom: '1px solid #e9ecef' }}>
      {/* Basic Info */}
      <SectionHeading>Basic Info</SectionHeading>
      <Grid gutter="sm">
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <FieldCell
            label="Type"
            fieldId="customer_sub_type"
            contact={contact}
            defaultType="enum"
            meta={meta}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <FieldCell
            label="Company"
            fieldId="company_name"
            contact={contact}
            defaultType="text"
            meta={meta}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <FieldCell
            label="First Name"
            fieldId="first_name"
            contact={contact}
            defaultType="text"
            meta={meta}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <FieldCell
            label="Last Name"
            fieldId="last_name"
            contact={contact}
            defaultType="text"
            meta={meta}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <FieldCell
            label="Email"
            fieldId="email"
            contact={contact}
            defaultType="email"
            meta={meta}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <FieldCell
            label="Mobile"
            fieldId="mobile"
            contact={contact}
            defaultType="phone"
            meta={meta}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <FieldCell
            label="Phone"
            fieldId="phone"
            contact={contact}
            defaultType="phone"
            meta={meta}
          />
        </Grid.Col>
      </Grid>

      {/* Billing Address */}
      <SectionHeading>Billing Address</SectionHeading>
      <Grid gutter="sm">
        <Grid.Col span={12}>
          <FieldCell
            label="Street"
            fieldId="address"
            contact={contact}
            defaultType="text"
            meta={meta}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <FieldCell
            label="City"
            fieldId="billing_city"
            contact={contact}
            defaultType="text"
            meta={meta}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <FieldCell
            label="State"
            fieldId="billing_state"
            contact={contact}
            defaultType="text"
            meta={meta}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <FieldCell
            label="Zip / Postal Code"
            fieldId="billing_zip"
            contact={contact}
            defaultType="text"
            meta={meta}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, xs: 6 }}>
          <FieldCell
            label="Country"
            fieldId="billing_country"
            contact={contact}
            defaultType="text"
            meta={meta}
          />
        </Grid.Col>
      </Grid>

      {/* Member Info (custom fields) */}
      {customFields.length > 0 && (
        <>
          <SectionHeading>Member Info</SectionHeading>
          <Grid gutter="sm">
            {customFields.map((cf) => (
              <Grid.Col key={cf.api_name} span={{ base: 12, xs: 6 }}>
                <FieldCell
                  label={cf.label ?? cf.api_name}
                  fieldId={cf.api_name}
                  contact={contact}
                  defaultType={cfDefaultType(cf)}
                  meta={meta}
                />
              </Grid.Col>
            ))}
          </Grid>
        </>
      )}
    </Stack>
  )
}
