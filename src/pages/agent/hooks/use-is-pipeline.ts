import { useMemo } from 'react'
import { Operator } from '../constant'
import useGraphStore from '../store'

/**
 * Hook to check if the current agent is a pipeline type
 * Pipeline agents start with File node instead of Begin node
 */
export const useIsPipeline = () => {
  const { nodes } = useGraphStore((state) => state)

  const isPipeline = useMemo(() => {
    return nodes.some((node) => node.data?.label === Operator.File)
  }, [nodes])

  return isPipeline
}
