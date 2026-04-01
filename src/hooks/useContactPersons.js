import { useQuery } from '@tanstack/react-query'
import { useZohoAuth } from './useZohoAuth.jsx'
import { fetchContactPersons } from '../lib/zohoApi.js'

export function useContactPersons(contactId) {
  const { accessToken, orgId, region } = useZohoAuth()

  return useQuery({
    queryKey: ['contactPersons', contactId],
    queryFn: () => fetchContactPersons(accessToken, orgId, region, contactId),
    enabled: !!contactId && !!accessToken,
    staleTime: 60_000,
  })
}
