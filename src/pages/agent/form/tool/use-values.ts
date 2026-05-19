import isEmpty from 'lodash/isEmpty.js'
import { useMemo } from 'react'
import { Operator } from '../../constant'
import { useAgentToolInitialValues } from '../../hooks/use-agent-tool-initial-values'
import type { RAGFlowNodeType } from '../../types'
import { useSelectedTool } from './use-selected-tool'

export function useValues(node?: RAGFlowNodeType) {
  const toolContext = useSelectedTool(node)
  const { initializeAgentToolValues } = useAgentToolInitialValues()

  return useMemo(() => {
    const params =
      (toolContext?.tool as { params?: Record<string, unknown> } | undefined)
        ?.params || {}

    if (!isEmpty(params)) {
      return params
    }

    return initializeAgentToolValues(
      (toolContext?.operator || Operator.Tool) as Operator,
    )
  }, [initializeAgentToolValues, toolContext?.operator, toolContext?.tool])
}
