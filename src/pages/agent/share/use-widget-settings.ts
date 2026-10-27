import { useQueryClient } from '@tanstack/react-query'
import { useSetAgent } from '@/hooks/use-agent-mutation'
import { agentQueryKeys } from '@/hooks/use-agent-query'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { useBuildDslData } from '../hooks/use-build-dsl'
import {
  normalizeWidgetSettings,
  widgetSettingsGlobalKey,
  type WidgetSettings,
} from './widget-settings'

export function useWidgetSettings(agentId: string, title: string) {
  const queryClient = useQueryClient()
  const { buildDslData } = useBuildDslData()
  const { setAgent, isLoading } = useSetAgent({
    showToast: false,
    errorFeedback: MutationErrorFeedback.Local,
  })

  const saveWidgetSettings = async (settings: WidgetSettings) => {
    const dsl = buildDslData()
    await setAgent({
      id: agentId,
      title,
      dsl: {
        ...dsl,
        globals: {
          ...dsl.globals,
          [widgetSettingsGlobalKey]: normalizeWidgetSettings(settings),
        },
      },
    })
    // PUT returns a success boolean. Restore settings from the canonical GET,
    // rather than treating the mutation result as a complete Agent document.
    await queryClient.refetchQueries(
      {
        queryKey: agentQueryKeys.detail(agentId),
        exact: true,
      },
      { throwOnError: true },
    )
  }

  return { saveWidgetSettings, savingWidgetSettings: isLoading }
}
