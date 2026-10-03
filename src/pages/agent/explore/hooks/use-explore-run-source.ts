import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { agentAPI } from '@/api/agent'
import { APIError } from '@/api/client-types'
import { agentQueryKeys } from '@/hooks/use-agent-query'
import { adaptAgentFlow } from '../../adapters'
import type { AgentFlow, AgentSession } from '@/types/agent'

/** Form previews are not authorization. Session execution stays server-bound. */
export function useExploreRunSource(
  canvasId: string,
  draft: AgentFlow | undefined,
  session: AgentSession | undefined,
  published: boolean,
) {
  const versions = useQuery({
    queryKey: agentQueryKeys.versions(canvasId),
    enabled: published,
    queryFn: () => agentAPI.fetchVersions(canvasId),
  })
  const versionId = versions.data
    ?.filter((version) => version.release)
    .sort((a, b) => (b.create_time ?? 0) - (a.create_time ?? 0))[0]?.id
  const version = useQuery({
    queryKey: agentQueryKeys.version(`${canvasId}:${versionId || ''}`),
    enabled: published && Boolean(versionId),
    queryFn: async () =>
      adaptAgentFlow(await agentAPI.fetchVersion(canvasId, versionId!)),
  })
  const restored = useMemo(
    () =>
      session?.dsl
        ? adaptAgentFlow({ id: canvasId, dsl: session.dsl })
        : undefined,
    [canvasId, session],
  )
  const unavailable = published && versions.isSuccess && !versionId
  return {
    source: restored ?? (published ? version.data : draft),
    loading:
      published &&
      (versions.isPending || (Boolean(versionId) && version.isPending)),
    error: published
      ? (versions.error ??
        version.error ??
        (unavailable ? new APIError(409, 'PUBLISHED_UNAVAILABLE', '') : null))
      : null,
    retry: async () => {
      if (!published) return
      await versions.refetch()
      if (versionId) await version.refetch()
    },
  }
}
