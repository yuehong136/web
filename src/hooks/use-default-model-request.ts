import { useMemo } from 'react'
import { APIError } from '@/api/client'
import { modelProvidersAPI } from '@/api/llm-providers'
import type { ModelType } from '@/api/llm-provider-types'
import type { TenantModelSettings } from '@/api/auth'
import { useFetchTenantInfo } from '@/hooks/use-team-request'
import {
  useModelDefaults,
  useModelProviderMutation,
} from '@/hooks/use-model-provider-request'

export const modelDefaultFields = {
  llm_id: 'chat',
  embd_id: 'embedding',
  img2txt_id: 'image2text',
  asr_id: 'speech2text',
  rerank_id: 'rerank',
  tts_id: 'tts',
  ocr_id: 'ocr',
} as const satisfies Record<string, ModelType>
export function useDefaultModelRequest() {
  const tenant = useFetchTenantInfo()
  const defaults = useModelDefaults()
  const mutation = useModelProviderMutation()
  const dictionary = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(modelDefaultFields).map(([field, type]) => [
          field,
          defaults.data?.find((row) => row.model_type === type)?.reference ??
            '',
        ]),
      ),
    [defaults.data],
  )
  const tenantInfo = useMemo(
    () =>
      tenant.tenantInfo && defaults.data
        ? { ...tenant.tenantInfo, ...dictionary }
        : null,
    [tenant.tenantInfo, defaults.data, dictionary],
  )
  const mutateAsync = async (values: TenantModelSettings) =>
    mutation.mutateAsync(async (isCurrent) => {
      for (const [field, type] of Object.entries(modelDefaultFields)) {
        const value = values[field as keyof TenantModelSettings]
        if (value === undefined || value === dictionary[field]) continue
        if (
          typeof value !== 'string' ||
          (value &&
            (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))))
        )
          throw new APIError(
            422,
            'INVALID_MODEL_ID',
            'Select a configured model',
          )
        if (!isCurrent())
          throw new DOMException('Request superseded', 'AbortError')
        await modelProvidersAPI.setDefault(type, value ? Number(value) : null)
      }
    })
  return {
    tenantInfo,
    isError: tenant.isError || defaults.isError,
    isLoading: tenant.isLoading || defaults.isPending,
    refetch: () => Promise.all([tenant.refetch(), defaults.refetch()]),
    update: { isPending: mutation.isPending, mutateAsync },
  }
}
