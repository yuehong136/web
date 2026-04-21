import { useCallback } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  AgentDialogueMode,
  WebhookContentType,
  WebhookExecutionMode,
  WebhookMaxBodySize,
  WebhookMethod,
  WebhookRateLimitPer,
  WebhookSecurityAuthType,
} from '../../constant'
import type { BeginFormValues } from './schema'

const initialWebhookValues = {
  methods: [WebhookMethod.Get],
  schema: {},
  'security.auth_type': WebhookSecurityAuthType.Basic,
  'security.rate_limit.per': WebhookRateLimitPer.Second,
  'security.rate_limit.limit': 10,
  'security.max_body_size': WebhookMaxBodySize[0],
  'response.status': 200,
  execution_mode: WebhookExecutionMode.Immediately,
  content_types: WebhookContentType.ApplicationJson,
}

export function useHandleModeChange(form: UseFormReturn<BeginFormValues>) {
  const handleModeChange = useCallback(
    (mode: string) => {
      if (mode !== AgentDialogueMode.Webhook) {
        return
      }

      Object.entries(initialWebhookValues).forEach(([key, value]) => {
        form.setValue(
          key as Parameters<typeof form.setValue>[0],
          value as Parameters<typeof form.setValue>[1],
          {
          shouldDirty: true,
          shouldValidate: true,
          },
        )
      })
    },
    [form],
  )

  return { handleModeChange }
}
