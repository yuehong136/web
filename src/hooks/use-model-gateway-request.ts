import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { APIError } from '@/api/client'
import { isMissingRouteError } from '@/api/legacy-fallback'
import {
  modelGatewayAPI,
  type GatewayKeyCreateInput,
  type GatewayKeyUpdateInput,
  type GatewayLogQuery,
  type GatewayModelCreateInput,
  type GatewayModelUpdateInput,
  type GatewayUsageQuery,
} from '@/api/model-gateway'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'

export const modelGatewayKeys = {
  all: ['model-gateway'] as const,
  models: () => [...modelGatewayKeys.all, 'models'] as const,
  candidates: () => [...modelGatewayKeys.all, 'candidates'] as const,
  keys: () => [...modelGatewayKeys.all, 'keys'] as const,
  logs: (query: GatewayLogQuery) =>
    [...modelGatewayKeys.all, 'logs', query] as const,
  usage: (query: GatewayUsageQuery) =>
    [...modelGatewayKeys.all, 'usage', query] as const,
}

/**
 * A missing route means the gateway is not enabled on the server. Retrying
 * cannot change that, so it is reported at once; other failures keep the
 * default two retries.
 */
const retryUnlessSettled = (failureCount: number, error: unknown) => {
  if (isMissingRouteError(error)) return false
  if (error instanceof APIError && [401, 403].includes(error.status))
    return false
  return failureCount < 2
}

export const useFetchGatewayModels = () =>
  useQuery({
    queryKey: modelGatewayKeys.models(),
    queryFn: ({ signal }) => modelGatewayAPI.listModels(signal),
    retry: retryUnlessSettled,
  })

export const useFetchGatewayCandidates = (enabled: boolean) =>
  useQuery({
    queryKey: modelGatewayKeys.candidates(),
    queryFn: ({ signal }) => modelGatewayAPI.listCandidates(signal),
    enabled,
    retry: retryUnlessSettled,
  })

export const useFetchGatewayKeys = () =>
  useQuery({
    queryKey: modelGatewayKeys.keys(),
    queryFn: ({ signal }) => modelGatewayAPI.listKeys(signal),
    retry: retryUnlessSettled,
  })

export const useFetchGatewayLogs = (query: GatewayLogQuery) =>
  useQuery({
    queryKey: modelGatewayKeys.logs(query),
    queryFn: ({ signal }) => modelGatewayAPI.queryLogs(query, signal),
    // Keep the previous page on screen while the next one loads.
    placeholderData: keepPreviousData,
    retry: retryUnlessSettled,
  })

export const useFetchGatewayUsage = (query: GatewayUsageQuery) =>
  useQuery({
    queryKey: modelGatewayKeys.usage(query),
    queryFn: ({ signal }) => modelGatewayAPI.usage(query, signal),
    placeholderData: keepPreviousData,
    retry: retryUnlessSettled,
  })

function useInvalidate(...targets: Array<'models' | 'candidates' | 'keys'>) {
  const queryClient = useQueryClient()
  return () => {
    for (const target of targets)
      void queryClient.invalidateQueries({
        queryKey: modelGatewayKeys[target](),
      })
  }
}

const local = { errorFeedback: MutationErrorFeedback.Local }

export const useCreateGatewayModel = () => {
  const invalidate = useInvalidate('models')
  return useMutation({
    meta: local,
    mutationFn: (input: GatewayModelCreateInput) =>
      modelGatewayAPI.createModel(input),
    onSuccess: invalidate,
  })
}

export const useUpdateGatewayModel = () => {
  const invalidate = useInvalidate('models')
  return useMutation({
    meta: local,
    mutationFn: ({
      id,
      input,
    }: {
      id: string
      input: GatewayModelUpdateInput
    }) => modelGatewayAPI.updateModel(id, input),
    onSuccess: invalidate,
  })
}

/** Keys list the published models they may use, so both lists are refreshed. */
export const useDeleteGatewayModel = () => {
  const invalidate = useInvalidate('models', 'keys')
  return useMutation({
    meta: local,
    mutationFn: (id: string) => modelGatewayAPI.deleteModel(id),
    onSuccess: invalidate,
  })
}

/**
 * The response carries the plaintext key. `gcTime: 0` keeps it out of the
 * mutation cache once the caller has taken it; callers also `reset()` after
 * handing it to the reveal dialog.
 */
export const useCreateGatewayKey = () => {
  const invalidate = useInvalidate('keys')
  return useMutation({
    meta: local,
    gcTime: 0,
    mutationFn: (input: GatewayKeyCreateInput) =>
      modelGatewayAPI.createKey(input),
    onSuccess: invalidate,
  })
}

export const useUpdateGatewayKey = () => {
  const invalidate = useInvalidate('keys')
  return useMutation({
    meta: local,
    mutationFn: ({ id, input }: { id: string; input: GatewayKeyUpdateInput }) =>
      modelGatewayAPI.updateKey(id, input),
    onSuccess: invalidate,
  })
}

export const useRevokeGatewayKey = () => {
  const invalidate = useInvalidate('keys')
  return useMutation({
    meta: local,
    mutationFn: (id: string) => modelGatewayAPI.revokeKey(id),
    onSuccess: invalidate,
  })
}
