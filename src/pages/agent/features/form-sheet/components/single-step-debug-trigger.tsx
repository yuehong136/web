import { Button } from '@/components/ui/button'
import { useFetchAgent } from '@/hooks/use-agent-query'
import { resolveLocalizedText } from '@/lib/agent'
import { toast } from '@/lib/toast'
import { CirclePlay } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useSaveGraph } from '../../../hooks/use-save-graph'
import { SingleStepDebugSheet } from './single-step-debug-sheet'

interface SingleStepDebugTriggerProps {
  visible: boolean
  canvasId?: string
  componentId?: string
}

export function SingleStepDebugTrigger({
  visible,
  canvasId,
  componentId,
}: SingleStepDebugTriggerProps) {
  const [open, setOpen] = useState(false)
  const { agent } = useFetchAgent(canvasId)
  const { saveGraph, loading: saving } = useSaveGraph(canvasId, false)

  const handleOpen = useCallback(async () => {
    if (!canvasId || !componentId) {
      toast.error('缺少调试上下文，无法打开单步调试')
      return
    }

    const saved = await saveGraph(
      resolveLocalizedText(agent?.title, '未命名资产'),
    )

    if (!saved) {
      toast.error('保存失败，无法打开单步调试')
      return
    }

    setOpen(true)
  }, [agent?.title, canvasId, componentId, saveGraph])

  if (!visible || !componentId) {
    return null
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-text-secondary hover:text-text-primary"
        onClick={handleOpen}
        disabled={saving}
        aria-label="单步调试"
        title="单步调试"
      >
        <CirclePlay className="size-4" />
      </Button>

      <SingleStepDebugSheet
        open={open}
        canvasId={canvasId}
        componentId={componentId}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
