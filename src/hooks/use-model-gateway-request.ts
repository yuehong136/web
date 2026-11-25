import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { APIError } from '@/api/client'
import { isMissingRouteError } from '@/api/legacy-fallback'
import {
  modelGatewayAPI,
  type GatewayCatalog,
  type GatewayCatalogModel,
  type GatewayCatalogModelUpdate,
  type GatewayKeyCreateInput,
  type GatewayKeyUpdateInput,
  type GatewayLogQuery,
  type GatewayUsageQuery,
  type GatewayWindow,
} from '@/api/model-gateway'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'

export const modelGatewayKeys = {
  all: ['model-gateway'] as const,
  catalog: () => [...modelGatewayKeys.all, 'catalog'] as const,
  keys: () => [...modelGatewayKeys.all, 'keys'] as const,
  overviews: () => [...modelGatewayKeys.all, 'overview'] as const,
  overview: (days: GatewayWindow) =>
    [...modelGatewayKeys.overviews(), days] as const,
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

export const useFetchGatewayCatalog = () =>
  useQuery({
    queryKey: modelGatewayKeys.catalog(),
    queryFn: ({ signal }) => modelGatewayAPI.getCatalog(signal),
    retry: retryUnlessSettled,
  })

export const useFetchGatewayKeys = () =>
  useQuery({
    queryKey: modelGatewayKeys.keys(),
    queryFn: ({ signal }) => modelGatewayAPI.listKeys(signal),
    retry: retryUnlessSettled,
  })

export const useFetchGatewayOverview = (days: GatewayWindow) =>
  useQuery({
    queryKey: modelGatewayKeys.overview(days),
    queryFn: ({ signal }) => modelGatewayAPI.getOverview(days, signal),
    // Keep the previous window on screen while another one loads.
    placeholderData: keepPreviousData,
    retry: retryUnlessSettled,
  })

/** How often a live request log asks for new rows. */
export const GATEWAY_LOGS_LIVE_INTERVAL = 10_000

export const useFetchGatewayLogs = (query: GatewayLogQuery, live = false) =>
  useQuery({
    queryKey: modelGatewayKeys.logs(query),
    queryFn: ({ signal }) => modelGatewayAPI.queryLogs(query, signal),
    // Keep the previous page on screen while the next one loads.
    placeholderData: keepPreviousData,
    // Polling stops by itself while the tab is in the background.
    refetchInterval: live ? GATEWAY_LOGS_LIVE_INTERVAL : false,
    retry: retryUnlessSettled,
  })

export const useFetchGatewayUsage = (
  query: GatewayUsageQuery,
  enabled = true,
) =>
  useQuery({
    queryKey: modelGatewayKeys.usage(query),
    queryFn: ({ signal }) => modelGatewayAPI.usage(query, signal),
    enabled,
    retry: retryUnlessSettled,
  })

const local = { errorFeedback: MutationErrorFeedback.Local }

/** Counts on the overview follow every catalog and key change. */
const refreshOverview = (client: QueryClient) =>
  void client.invalidateQueries({ queryKey: modelGatewayKeys.overviews() })

/** Responses that carry the whole catalog replace the cached one. */
const storeCatalog = (client: QueryClient, catalog: GatewayCatalog) => {
  client.setQueryData(modelGatewayKeys.catalog(), catalog)
  refreshOverview(client)
}

/**
 * One model's switch, alias, preference, description or limits. The model
 * is replaced at once; the catalog is then reloaded because an alias or a
 * preference also changes the names of other models.
 */
export const useUpdateCatalogModel = () => {
  const client = useQueryClient()
  return useMutation({
    meta: local,
    mutationFn: ({
      modelId,
      input,
    }: {
      modelId: string
      input: GatewayCatalogModelUpdate
    }) => modelGatewayAPI.updateCatalogModel(modelId, input),
    onSuccess: (model: GatewayCatalogModel) => {
      client.setQueryData<GatewayCatalog>(
        modelGatewayKeys.catalog(),
        (catalog) =>
          catalog && {
            ...catalog,
            models: catalog.models.map((item) =>
              item.model_id === model.model_id ? model : item,
            ),
          },
      )
      void client.invalidateQueries({ queryKey: modelGatewayKeys.catalog() })
      refreshOverview(client)
    },
  })
}

export const useUpdateCatalogInstance = () => {
  const client = useQueryClient()
  return useMutation({
    meta: local,
    mutationFn: ({
      instanceId,
      enabled,
    }: {
      instanceId: string
      enabled: boolean
    }) => modelGatewayAPI.updateCatalogInstance(instanceId, { enabled }),
    onSuccess: (catalog) => storeCatalog(client, catalog),
  })
}

export const useUpdateGatewaySettings = () => {
  const client = useQueryClient()
  return useMutation({
    meta: local,
    mutationFn: (newModelsEnabled: boolean) =>
      modelGatewayAPI.updateSettings({ new_models_enabled: newModelsEnabled }),
    onSuccess: (catalog) => storeCatalog(client, catalog),
  })
}

function useKeysChanged() {
  const client = useQueryClient()
  return () => {
    void client.invalidateQueries({ queryKey: modelGatewayKeys.keys() })
    refreshOverview(client)
  }
}

/**
 * The response carries the plaintext key. `gcTime: 0` keeps it out of the
 * mutation cache once the caller has taken it; callers also `reset()` after
 * handing it to the created dialog.
 */
export const useCreateGatewayKey = () => {
  const changed = useKeysChanged()
  return useMutation({
    meta: local,
    gcTime: 0,
    mutationFn: (input: GatewayKeyCreateInput) =>
      modelGatewayAPI.createKey(input),
    onSuccess: changed,
  })
}

export const useUpdateGatewayKey = () => {
  const changed = useKeysChanged()
  return useMutation({
    meta: local,
    mutationFn: ({ id, input }: { id: string; input: GatewayKeyUpdateInput }) =>
      modelGatewayAPI.updateKey(id, input),
    onSuccess: changed,
  })
}

export const useRevokeGatewayKey = () => {
  const changed = useKeysChanged()
  return useMutation({
    meta: local,
    mutationFn: (id: string) => modelGatewayAPI.revokeKey(id),
    onSuccess: changed,
  })
}
