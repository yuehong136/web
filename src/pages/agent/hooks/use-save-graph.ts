import { useCallback } from 'react'
import { useBuildDslData, type BuildDslDataOptions } from './use-build-dsl'
import type { RAGFlowNodeType } from '../types'
import { toast } from '@/lib/toast'
import { useSetAgent } from '@/hooks/use-agent-mutation'

export const useSaveGraph = (agentId?: string, showMessage: boolean = true) => {
  const { buildDslData } = useBuildDslData()
  const { setAgent, isLoading } = useSetAgent({ showToast: showMessage })

  const saveGraph = useCallback(
    async (
      title: string,
      currentNodes?: RAGFlowNodeType[],
      options?: {
        release?: boolean
      } & BuildDslDataOptions,
    ) => {
      if (!agentId) {
        if (showMessage) {
          toast.error('Agent ID is required')
        }
        return null
      }

      try {
        const dsl = buildDslData(currentNodes, {
          globalVariables: options?.globalVariables,
        })

        const result = await setAgent({
          id: agentId,
          title,
          dsl,
          ...(options?.release !== undefined
            ? { release: options.release }
            : {}),
        })

        return result
      } catch {
        return null
      }
    },
    [agentId, buildDslData, setAgent, showMessage],
  )

  return { saveGraph, loading: isLoading }
}
