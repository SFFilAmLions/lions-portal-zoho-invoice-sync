import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useZohoAuth } from './useZohoAuth.jsx'
import {
  fetchContactPersons,
  createContactPerson,
  updateContactPerson,
  deleteContactPerson,
} from '../lib/zohoApi.js'

export function useContactPersons(contactId) {
  const { accessToken, orgId, region } = useZohoAuth()

  return useQuery({
    queryKey: ['contactPersons', contactId],
    queryFn: () => fetchContactPersons(accessToken, orgId, region, contactId),
    enabled: !!contactId && !!accessToken,
    staleTime: 60_000,
  })
}

export function useUpdateContactPerson(contactId) {
  const { accessToken, orgId, region } = useZohoAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ personId, payload }) =>
      updateContactPerson(
        accessToken,
        orgId,
        region,
        contactId,
        personId,
        payload
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactPersons', contactId] })
    },
  })
}

export function useCreateContactPerson(contactId) {
  const { accessToken, orgId, region } = useZohoAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) =>
      createContactPerson(accessToken, orgId, region, contactId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactPersons', contactId] })
    },
  })
}

export function useDeleteContactPerson(contactId) {
  const { accessToken, orgId, region } = useZohoAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ personId }) =>
      deleteContactPerson(accessToken, orgId, region, contactId, personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactPersons', contactId] })
    },
  })
}
