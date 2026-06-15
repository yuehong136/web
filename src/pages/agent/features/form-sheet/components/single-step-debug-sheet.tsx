import { useCallback, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useDebugSingle, useFetchInputForm } from '@/hooks/use-agent-request'
import { toast } from '@/lib/toast'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import DebugContent from '../../../debug-content'
import { buildBeginInputListFromObject } from '../../../hooks/use-get-begin-query'
import type { BeginQuery } from '../../../types'
import { coerceBeginInputOrder } from '../../../utils/begin-input-order'

interface SingleStepDebugSheetProps {
  open: boolean
  canvasId?: string
  componentId?: string
  onClose: () => void
}

interface DebugResponseLike {
  retcode?: number
  code?: number
  ok?: boolean
  retmsg?: string
  message?: string
  [key: string]: unknown
}

function transferInputsArrayToObject(inputs: BeginQuery[] = []) {
  return inputs.reduce<Record<string, Omit<BeginQuery, 'key'>>>(
    (result, item, index) => {
      if (!item.key) {
        return result
      }

      const { key, ...rest } = item
      result[key] = {
        ...rest,
        order: coerceBeginInputOrder(rest.order) ?? index,
      }
      return result
    },
    {},
  )
}

export function SingleStepDebugSheet({
  open,
  canvasId,
  componentId,
  onClose,
}: SingleStepDebugSheetProps) {
  const { t } = useTranslation()
  const { data: inputForm } = useFetchInputForm(canvasId, componentId)
  const { debugSingle, isLoading } = useDebugSingle()
  const [result, setResult] = useState<unknown>(null)

  const parameters = useMemo(
    () =>
      buildBeginInputListFromObject(
        inputForm as Record<string, BeginQuery> | undefined,
      ),
    [inputForm],
  )

  const handleRunDebug = useCallback(
    async (nextValues: BeginQuery[]) => {
      if (!canvasId || !componentId) {
        toast.error(
          t(
            'flow.missingCanvasForDebug',
            'Missing canvas ID. Unable to debug.',
          ),
        )
        return
      }

      const response = await debugSingle({
        canvas_id: canvasId,
        component_id: componentId,
        inputs: transferInputsArrayToObject(nextValues),
      })
      const responseMeta =
        response && typeof response === 'object'
          ? (response as DebugResponseLike)
          : {}

      setResult(response)

      const ok =
        responseMeta.retcode === 0 ||
        responseMeta.code === 0 ||
        responseMeta.ok === true

      if (ok) {
        toast.success(
          t('flow.singleStepDebugStarted', 'Single-node debug started'),
        )
      } else if (responseMeta.retmsg || responseMeta.message) {
        toast.error(
          responseMeta.retmsg ||
            responseMeta.message ||
            t('flow.singleStepDebugFailed', 'Single-node debug failed'),
        )
      }
    },
    [canvasId, componentId, debugSingle, t],
  )

  const serializedResult = useMemo(() => {
    if (!result) {
      return ''
    }

    try {
      return JSON.stringify(result, null, 2)
    } catch {
      return String(result)
    }
  }, [result])

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose()
        }
      }}
      modal={false}
    >
      <SheetContent
        showOverlay={false}
        showCloseButton={false}
        className="top-20 p-0 sm:max-w-[560px]"
      >
        <SheetTitle className="sr-only">
          {t('flow.testRun', 'Test run')}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {t(
            'flow.singleStepDebugDescription',
            'Configure debug inputs for the current node and inspect the single-step result.',
          )}
        </SheetDescription>

        <SheetHeader className="border-border-primary px-space-md py-space-sm border-b">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-text-primary">
              {t('flow.testRun', 'Test run')}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-text-secondary transition-colors hover:text-text-primary"
              onClick={onClose}
            >
              <X className="size-4" />
            </Button>
          </div>
        </SheetHeader>

        <section className="px-space-md py-space-sm overflow-y-auto">
          <DebugContent
            canvasId={canvasId}
            parameters={parameters}
            ok={handleRunDebug}
            isNext={false}
            loading={isLoading}
            className="pb-space-md min-h-0 flex-1 overflow-auto"
            maxHeight="max-h-screen"
          />

          {result ? (
            <div className="mt-space-md rounded-radius-md border-border-primary bg-surface-secondary border">
              <div className="border-border-primary px-space-sm py-space-xs border-b text-sm text-text-secondary">
                JSON
              </div>
              <pre className="p-space-sm max-h-screen overflow-auto text-xs text-text-primary">
                {serializedResult}
              </pre>
            </div>
          ) : null}
        </section>
      </SheetContent>
    </Sheet>
  )
}
