import { useEffect, useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import {
  AgentDialogueMode,
  BeginId,
  WebhookExecutionMode,
  initialMessageValues,
} from '../../constant'
import useGraphStore from '../../store'
import type { RAGFlowNodeType } from '../../types'
import {
  normalizeMessageFormForEditor,
  normalizeMessageFormForStore,
} from '../../utils/message-content'

export function useMessageFormValues(node?: RAGFlowNodeType) {
  const values = useMemo(() => {
    const formData = node?.data?.form as Record<string, unknown> | undefined

    if (!formData || Object.keys(formData).length === 0) {
      return normalizeMessageFormForEditor(
        initialMessageValues as Record<string, unknown>,
      )
    }

    return normalizeMessageFormForEditor(formData)
  }, [node?.data?.form])

  return values
}

export function useWatchMessageFormChange(
  id?: string,
  form?: UseFormReturn,
) {
  const values = useWatch({ control: form?.control })
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)

  useEffect(() => {
    if (!id || !form?.formState.isDirty) {
      return
    }

    const nextValues = normalizeMessageFormForStore(
      (form.getValues() || {}) as Record<string, unknown>,
    )

    updateNodeForm(id, nextValues)
  }, [form, form?.formState.isDirty, id, updateNodeForm, values])
}

export function useMessageWebhookState(form?: UseFormReturn) {
  const beginNode = useGraphStore((state) => state.getNode(BeginId))
  const beginForm = (beginNode?.data?.form || {}) as Record<string, unknown>
  const isWebhookMode = beginForm.mode === AgentDialogueMode.Webhook
  const showWebhookResponseStatus =
    isWebhookMode &&
    beginForm.execution_mode === WebhookExecutionMode.Streaming

  useEffect(() => {
    if (!showWebhookResponseStatus || !form) {
      return
    }

    if (typeof form.getValues('status') !== 'number') {
      form.setValue('status', 200, {
        shouldDirty: true,
      })
    }
  }, [form, showWebhookResponseStatus])

  return {
    isWebhookMode,
    showWebhookResponseStatus,
  }
}
