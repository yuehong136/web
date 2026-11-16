import pick from 'lodash/pick'
import { useEffect, useMemo, useRef } from 'react'
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

  // isDirty clears once values return to their defaults; that edit must sync too.
  const editedMcp = useRef<string>(undefined)

  useEffect(() => {
    const mcp = `${agentNodeId}:${mcpIndex}`
    if (form.formState.isDirty) editedMcp.current = mcp
    if (editedMcp.current !== mcp || Object.keys(tools).length === 0) {
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
