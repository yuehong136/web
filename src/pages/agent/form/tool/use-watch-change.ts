import { useEffect, useRef } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import useGraphStore from '../../store'
import type { RAGFlowNodeType } from '../../types'
import { useSelectedTool } from './use-selected-tool'

export function useWatchFormChange<
  TFieldValues extends FieldValues = FieldValues,
>(form: UseFormReturn<TFieldValues>, node?: RAGFlowNodeType) {
  const values = useWatch({ control: form.control })
  const toolContext = useSelectedTool(node)
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)
  // isDirty clears once values return to their defaults; that edit must sync too.
  const editedTool = useRef<string>(undefined)

  useEffect(() => {
    const tool = `${toolContext?.agentNodeId}:${toolContext?.toolIndex}`
    if (form.formState.isDirty) editedTool.current = tool
    if (
      editedTool.current !== tool ||
      !toolContext?.agentNodeId ||
      typeof toolContext.toolIndex !== 'number'
    ) {
      return
    }

    updateNodeForm(toolContext.agentNodeId, form.getValues(), [
      'tools',
      toolContext.toolIndex,
      'params',
    ])
  }, [
    form,
    form.formState.isDirty,
    toolContext?.agentNodeId,
    toolContext?.toolIndex,
    updateNodeForm,
    values,
  ])
}
