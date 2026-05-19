import { useEffect } from 'react'
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

  useEffect(() => {
    if (
      !form.formState.isDirty ||
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
