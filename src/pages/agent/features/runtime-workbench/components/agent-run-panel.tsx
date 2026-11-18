import { SectionCard } from '@/components/patterns'
import { useTranslation } from 'react-i18next'
import DebugContent from '../../../debug-content'
import type { AgentRuntimeController } from '../types'

interface AgentRunPanelProps {
  controller: AgentRuntimeController
}

export function AgentRunPanel({ controller }: AgentRunPanelProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-space-lg p-space-md">
      <SectionCard title={t('agent.runtime.startInput')} padding="default">
        <div className="space-y-space-md">
          <p className="text-sm text-fg-muted">
            {controller.isTaskMode
              ? t('agent.runtimePanel.runPanel.taskModeHint')
              : t('agent.runtimePanel.runPanel.chatModeHint')}
          </p>

          <DebugContent
            canvasId={controller.canvasId}
            parameters={controller.beginInputs}
            ok={controller.handleRun}
            isNext={false}
            loading={controller.loading || controller.saving}
            btnText={
              controller.isTaskMode
                ? t('agent.runtime.startRun')
                : t('agent.runtime.enterChat')
            }
            className="min-h-0"
            maxHeight="max-h-none"
          />
        </div>
      </SectionCard>

      {!controller.beginInputs.length ? (
        <SectionCard
          title={t('agent.runtime.runInstructions')}
          padding="default"
        >
          <p className="text-sm text-fg-muted">
            {t('agent.runtimePanel.runPanel.noInputFields')}
          </p>
        </SectionCard>
      ) : null}
    </div>
  )
}
