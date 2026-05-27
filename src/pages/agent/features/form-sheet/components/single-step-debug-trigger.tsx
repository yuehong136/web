import { Button } from '@/components/ui/button'
import { useFetchAgent } from '@/hooks/use-agent-query'
import { resolveLocalizedText } from '@/lib/agent'
import { toast } from '@/lib/toast'
import { CirclePlay } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

  const handleOpen = useCallback(async () => {
    if (!canvasId || !componentId) {
      toast.error(
        t(
          'flow.missingDebugContext',
          'Missing debug context. Unable to open single-step debug.',
        ),
      )
      return
    }

    const saved = await saveGraph(
      resolveLocalizedText(
        agent?.title,
        t('agent.unnamedAsset', 'Untitled asset'),
      ),
    )

    if (!saved) {
      toast.error(
        t(
          'flow.saveBeforeDebugFailed',
          'Save failed. Unable to open single-step debug.',
        ),
      )
      return
    }

    setOpen(true)
  }, [agent?.title, canvasId, componentId, saveGraph, t])

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
        aria-label={t('flow.singleStepDebug', 'Single-step debug')}
        title={t('flow.singleStepDebug', 'Single-step debug')}
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
