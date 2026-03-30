import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { fetchContacts, updateContact } from '../lib/zohoApi.js'
import { useZohoAuth } from './useZohoAuth.js'

export function useCustomers({ page = 1, perPage = 25 } = {}) {
  const { accessToken, orgId, region, apiDomain } = useZohoAuth()

  return useQuery({
    queryKey: ['contacts', orgId, page, perPage],
    queryFn: () => fetchContacts(accessToken, orgId, region, apiDomain, { page, perPage }),
    enabled: !!(accessToken && orgId),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  const { accessToken, orgId, region, apiDomain } = useZohoAuth()

  return useMutation({
    mutationFn: ({ contactId, payload }) =>
      updateContact(accessToken, orgId, region, apiDomain, contactId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
    },
  })
}
