import { useCallback } from 'react'
import { useAuthStore } from '@/stores'
import { useFetchJoinedTeams } from '@/hooks/use-team-request'
import { TenantRole } from '@/types/team'

export const useAbilities = () => {
  const user = useAuthStore((s) => s.user)
  const { joinedTeams } = useFetchJoinedTeams()

  const canDownloadInTenant = useCallback(
    (tenantId?: string) => {
      if (!tenantId) return false

      if (tenantId === user?.id) return true

      const team = joinedTeams.find((t) => t.tenant_id === tenantId)
      if (!team) return false
      return team.role === TenantRole.Owner || team.role === TenantRole.Admin
    },
    [user?.id, joinedTeams],
  )

  return {
    canDownloadInTenant,
  }
}
