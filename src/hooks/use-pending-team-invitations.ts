import { useFetchJoinedTeams } from '@/hooks/use-team-request'
import { useAuthStore } from '@/stores/auth'
import { TenantRole } from '@/types/team'

/** Pending membership actions use the team query, rather than an inbox. */
export const usePendingTeamInvitations = () => {
  const authenticated = useAuthStore((state) => state.isAuthenticated)
  const { joinedTeams, isError } = useFetchJoinedTeams({
    enabled: authenticated,
    refetchOnWindowFocus: true,
  })
  const pendingCount =
    authenticated && !isError
      ? joinedTeams.filter((team) => team.role === TenantRole.Invite).length
      : 0
  return { pendingCount }
}
