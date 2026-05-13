import { toast } from '@/lib/toast'
import i18n from '@/locales/i18n'
import { useSetAgent } from '@/hooks/use-agent-request'
import type { AgentFlow } from '@/types/agent'

export function useRenameAgent() {
  const setAgent = useSetAgent({ showToast: false })

  return {
    isLoading: setAgent.isLoading,
    rename: async (flow: AgentFlow, nextTitle: string) => {
      const trimmed = nextTitle.trim()
      if (!trimmed) {
        return
      }
      const canvasType =
        flow.canvas_type === 'Recommended' || flow.canvas_type === null
          ? undefined
          : flow.canvas_type

      await setAgent.setAgent({
        id: flow.id,
        title: trimmed,
        description:
          typeof flow.description === 'string' ? flow.description : undefined,
        dsl: flow.dsl,
        canvas_type: canvasType,
        canvas_category: flow.canvas_category,
        avatar: flow.avatar,
        permission:
          typeof flow.permission === 'string' ? flow.permission : undefined,
      })
      toast.success(i18n.t('agents.renameSuccess', '已更新名称'))
    },
  }
}
