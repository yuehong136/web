import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import OperatorIcon from '../../../operator-icon'
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
  return (
    <div className="flex items-center gap-space-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-radius-md bg-surface-secondary text-text-primary">
        <OperatorIcon name={iconKey} className="size-5" />
      </div>

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
        onClick={onClose}
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
