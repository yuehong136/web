import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { modelProvidersAPI } from '@/api/llm-providers'
import { llmKeys } from '@/hooks/use-llm-request'
import { teamKeys } from '@/hooks/use-team-request'
import { skillKeys } from '@/hooks/use-skill-request'
import { skillCoreKeys } from '@/hooks/use-skill-core-request'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'

export const modelProviderKeys = {
  all: ['model-providers'] as const,
  providers: () => [...modelProviderKeys.all, 'configured'] as const,
  instances: (provider: string) =>
    [...modelProviderKeys.all, 'instances', provider] as const,
  models: () => [...modelProviderKeys.all, 'models'] as const,
  defaults: () => [...modelProviderKeys.all, 'defaults'] as const,
}
export const useModelProviders = () =>
  useQuery({
    queryKey: modelProviderKeys.providers(),
    queryFn: ({ signal }) => modelProvidersAPI.providers(false, signal),
  })
export const useProviderInstances = (provider: string) =>
  useQuery({
    queryKey: modelProviderKeys.instances(provider),
    queryFn: ({ signal }) => modelProvidersAPI.instances(provider, signal),
    enabled: !!provider,
  })
export const useTenantModels = () =>
  useQuery({
    queryKey: modelProviderKeys.models(),
    queryFn: ({ signal }) => modelProvidersAPI.models(signal),
  })
export const useModelDefaults = () =>
  useQuery({
    queryKey: modelProviderKeys.defaults(),
    queryFn: ({ signal }) => modelProvidersAPI.defaults(signal),
  })

/** Guard every continuation, including invalidation, against a changed account. */
export function useModelProviderMutation() {
  const client = useQueryClient()
  return useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (
      operation: (isCurrent: () => boolean) => Promise<unknown>,
    ) => {
      const isCurrent = apiClient.captureOwner()
      try {
        const result = await operation(isCurrent)
        if (!isCurrent())
          throw new DOMException('Request superseded', 'AbortError')
        return result
      } finally {
        if (isCurrent())
          await Promise.all(
            [
              modelProviderKeys.all,
              llmKeys.all,
              teamKeys.tenantInfo(),
              skillKeys.models(),
              skillCoreKeys.models(),
            ].map((queryKey) => client.invalidateQueries({ queryKey })),
          )
      }
    },
  })
}

export function useDefaultModelReference(
  type: import('@/api/llm-provider-types').ModelType,
) {
  const query = useModelDefaults()
  return {
    reference:
      query.data?.find((model) => model.model_type === type)?.reference ?? '',
    isPending: query.isPending,
    isError: query.isError,
  }
}
