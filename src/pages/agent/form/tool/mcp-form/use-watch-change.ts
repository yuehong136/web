import pick from 'lodash/pick'
import { useEffect, useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import useGraphStore from '../../../store'

export function useWatchFormChange(
  form: UseFormReturn<{ items?: string[] }>,
  {
    agentNodeId,
    mcpIndex,
    tools,
  }: {
    agentNodeId: string
    mcpIndex: number
    tools: Record<string, unknown>
  },
) {
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)
  const watchedItems = useWatch({ control: form.control, name: 'items' })

  const nextTools = useMemo(
    () => pick(tools, watchedItems || []),
    [tools, watchedItems],
  )

  useEffect(() => {
    if (!form.formState.isDirty || Object.keys(tools).length === 0) {
      return
    }

    updateNodeForm(agentNodeId, nextTools, ['mcp', mcpIndex, 'tools'])
  }, [
    agentNodeId,
    form,
    form.formState.isDirty,
    mcpIndex,
    nextTools,
    tools,
    updateNodeForm,
  ])
}
