import { useTranslation } from 'react-i18next'
import { ArrowLeft, Play, Save } from 'lucide-react'
import { PageHeader } from '@/components/patterns'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import {
  StatusDot,
  type StatusDotTone,
} from '@/components/studio/collection-identity'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AgentFlow } from '@/types/agent'
import { AgentRuntimeStatus } from '../features/runtime-workbench/types'

const STATUS_TONE: Record<AgentRuntimeStatus, StatusDotTone> = {
  [AgentRuntimeStatus.IDLE]: 'neutral',
  [AgentRuntimeStatus.PREPARING]: 'running',
  [AgentRuntimeStatus.RUNNING]: 'running',
  [AgentRuntimeStatus.SUCCESS]: 'success',
  [AgentRuntimeStatus.ERROR]: 'error',
  [AgentRuntimeStatus.STOPPED]: 'warning',
}

const STATUS_LABEL = {
  [AgentRuntimeStatus.IDLE]: 'agent.runtime.idle',
  [AgentRuntimeStatus.PREPARING]: 'agent.runtime.preparing',
  [AgentRuntimeStatus.RUNNING]: 'agent.runtime.running',
  [AgentRuntimeStatus.SUCCESS]: 'agent.runtime.success',
  [AgentRuntimeStatus.ERROR]: 'agent.runtime.error',
  [AgentRuntimeStatus.STOPPED]: 'agent.runtime.outputDetached',
} as const

export interface AgentEditorHeaderProps {
  flow: Pick<AgentFlow, 'id' | 'avatar'>
  kind: 'agent' | 'workflow'
  title: string
  onTitleChange: (title: string) => void
  autosaveLabel?: string
  runtimeStatus: AgentRuntimeStatus
  saving: boolean
  onBack: () => void
  onSave: () => void
  onRun: () => void
}

/**
 * The canvas header: back, the agent's identity with its editable name,
 * autosave and run status, then save and run.
 */
export function AgentEditorHeader({
  flow,
  kind,
  title,
  onTitleChange,
  autosaveLabel,
  runtimeStatus,
  saving,
  onBack,
  onSave,
  onRun,
}: AgentEditorHeaderProps) {
  const { t } = useTranslation()
  return (
    <PageHeader
      compact
      align="center"
      surface="plain"
      wrapActions
      className="min-h-13 border-b border-components-studio-border bg-components-studio-surface px-space-sm py-space-xs"
      leading={
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('agent.editor.back')}
          title={t('agent.editor.back')}
          onClick={onBack}
        >
          <ArrowLeft className="size-icon-md" />
        </Button>
      }
      title={
        <span className="flex max-w-xl min-w-0 items-center gap-space-sm">
          <EntityAvatar
            name={title}
            src={flow.avatar}
            seed={flow.id}
            badge={kind}
          />
          <Input
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            aria-label={t('agent.editor.nameLabel')}
            placeholder={t('agent.editor.namePlaceholder')}
            className="h-9 min-w-48 text-base font-semibold"
          />
        </span>
      }
      description={t('agent.editor.autosaveDescription', {
        id: flow.id,
        time: autosaveLabel || t('agent.editor.autosavePending'),
      })}
      actions={
        <>
          <StatusDot
            tone={STATUS_TONE[runtimeStatus]}
            label={t(STATUS_LABEL[runtimeStatus])}
            className="mr-space-xs"
          />
          <Button variant="outline" onClick={onSave} disabled={saving}>
            <Save className="mr-space-xs size-icon-sm" />
            {saving ? t('common.saving') : t('agent.editor.save')}
          </Button>
          <Button onClick={onRun}>
            <Play className="mr-space-xs size-icon-sm" />
            {t('agent.editor.run')}
          </Button>
        </>
      }
    />
  )
}
