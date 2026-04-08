import { useCallback, useMemo, useState } from 'react'
import {
  Button,
} from '@/components/ui/button'
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
import DebugContent from '../../../debug-content'
import { buildBeginInputListFromObject } from '../../../hooks/use-get-begin-query'
import type { BeginQuery } from '../../../types'

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
  return inputs.reduce<Record<string, Omit<BeginQuery, 'key'>>>((result, item) => {
    if (!item.key) {
      return result
    }

    const { key, ...rest } = item
    result[key] = rest
    return result
  }, {})
}

export function SingleStepDebugSheet({
  open,
  canvasId,
  componentId,
  onClose,
}: SingleStepDebugSheetProps) {
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
        toast.error('缺少画布 ID，无法调试')
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
        toast.success('已触发单节点调试')
      } else if (responseMeta.retmsg || responseMeta.message) {
        toast.error(responseMeta.retmsg || responseMeta.message || '单节点调试失败')
      }
    },
    [canvasId, componentId, debugSingle],
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
        showCloseButton={false}
        className="top-20 p-0 sm:max-w-[560px]"
      >
        <SheetTitle className="sr-only">测试运行</SheetTitle>
        <SheetDescription className="sr-only">
          配置当前节点的调试输入并查看单步调试结果
        </SheetDescription>

        <SheetHeader className="border-b border-border-primary px-space-md py-space-sm">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-text-primary">
              测试运行
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

        <section className="overflow-y-auto px-space-md py-space-sm">
          <DebugContent
            canvasId={canvasId}
            parameters={parameters}
            ok={handleRunDebug}
            isNext={false}
            loading={isLoading}
            className="min-h-0 flex-1 overflow-auto pb-space-md"
            maxHeight="max-h-screen"
          />

          {result ? (
            <div className="mt-space-md rounded-radius-md border border-border-primary bg-surface-secondary">
              <div className="border-b border-border-primary px-space-sm py-space-xs text-sm text-text-secondary">
                JSON
              </div>
              <pre className="max-h-screen overflow-auto p-space-sm text-xs text-text-primary">
                {serializedResult}
              </pre>
            </div>
          ) : null}
        </section>
      </SheetContent>
    </Sheet>
  )
}
