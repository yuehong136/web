import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authAPI, type TenantModelSettings } from '@/api/auth'
import { APIError } from '@/api/client-types'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { teamKeys, useFetchTenantInfo } from '@/hooks/use-team-request'
import type { TenantInfo } from '@/types/team'

/** Shares the tenant query with team settings; only a confirmed save updates the cache. */
export function useDefaultModelRequest() {
  const settings = useFetchTenantInfo()
  const queryClient = useQueryClient()
  const update = useMutation({
    meta: { errorFeedback: MutationErrorFeedback.Local },
    mutationFn: async (values: TenantModelSettings) => {
      const confirmed = await authAPI.updateTenantInfo(values)
      if (confirmed !== true)
        throw new APIError(
          502,
          'MODEL_SETTINGS_UNCONFIRMED',
          'Model settings update was not confirmed',
        )
      return values
    },
    onSuccess: (values) => {
      queryClient.setQueryData<TenantInfo>(teamKeys.tenantInfo(), (previous) =>
        previous?.tenant_id === values.tenant_id
          ? { ...previous, ...values }
          : previous,
      )
      if (
        queryClient.getQueryData<TenantInfo>(teamKeys.tenantInfo())
          ?.tenant_id === values.tenant_id
      ) {
        void queryClient.invalidateQueries({ queryKey: teamKeys.tenantInfo() })
      }
    },
  })
  return { ...settings, update }
}
