import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { OperatorTile } from '../../../operator-icon'
import type { OperatorHeaderProps } from '../types'
import { NodeTitleInput } from './node-title-input'
import { SingleStepDebugTrigger } from './single-step-debug-trigger'

export function OperatorHeader({
  node,
  titleEditable,
  iconKey,
  debugEnabled,
  canvasId,
  onClose,
}: OperatorHeaderProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-space-sm">
      <OperatorTile name={iconKey} size="lg" />

      <NodeTitleInput node={node} titleEditable={titleEditable} />

      <SingleStepDebugTrigger
        visible={debugEnabled}
        canvasId={canvasId}
        componentId={node?.id}
      />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-text-secondary hover:text-text-primary"
        aria-label={t('common.close')}
        title={t('common.close')}
        onClick={onClose}
      >
        <X className="size-icon-sm" />
      </Button>
    </div>
  )
}
