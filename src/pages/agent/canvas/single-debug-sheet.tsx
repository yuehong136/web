import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet'
import { useDebugSingle, useFetchInputForm } from '@/hooks/use-agent-request'
import DebugContent from '../debug-content'
import { buildBeginInputListFromObject } from '../hooks/use-get-begin-query'
import type { BeginQuery } from '../types'
import { toast } from '@/lib/toast'

interface SingleDebugSheetProps {
  open: boolean
  canvasId?: string
  componentId?: string
  onClose: () => void
}

function transferInputsArrayToObject(inputs: BeginQuery[] = []) {
  return inputs.reduce<Record<string, Omit<BeginQuery, 'key'>>>((pre, cur) => {
    if (!cur.key) return pre
    const { key, ...rest } = cur
    pre[key] = rest
    return pre
  }, {})
}

export function SingleDebugSheet({
  open,
  canvasId,
  componentId,
  onClose,
}: SingleDebugSheetProps) {
  const { t } = useTranslation()
  const { data: inputForm } = useFetchInputForm(canvasId, componentId)
  const { debugSingle, isLoading } = useDebugSingle()
  const [result, setResult] = useState<any>(null)

  const list = useMemo(() => {
    return buildBeginInputListFromObject(inputForm as Record<string, BeginQuery>)
  }, [inputForm])

  const handleOk = useCallback(
    async (nextValues: BeginQuery[]) => {
      if (!canvasId || !componentId) {
        toast.error(t('flow.debugFailed', '缺少画布 ID，无法调试'))
        return
      }
      const res = await debugSingle({
        canvas_id: canvasId,
        component_id: componentId,
        inputs: transferInputsArrayToObject(nextValues),
      })
      setResult(res)
      const ok = res?.retcode === 0 || res?.code === 0 || res?.ok === true
      if (ok) {
        toast.success(t('flow.debugStarted', '已触发单节点调试'))
      } else if (res?.retmsg || res?.message) {
        toast.error(res?.retmsg || res?.message)
      }
    },
    [canvasId, componentId, debugSingle, t],
  )

  const content = useMemo(() => {
    if (!result) return ''
    try {
      return JSON.stringify(result, null, 2)
    } catch {
      return String(result)
    }
  }, [result])

  return (
    <Sheet open={open} onOpenChange={onClose} modal={false}>
      <SheetContent className="top-20 p-0">
        <SheetHeader className="py-space-sm px-space-md">
          <div className="flex items-center justify-between">
            <span className="text-text-primary">
              {t('flow.testRun', '测试运行')}
            </span>
            <X onClick={onClose} className="size-4 cursor-pointer" />
          </div>
        </SheetHeader>
        <section className="overflow-y-auto pt-space-sm px-space-md">
          <DebugContent
            parameters={list}
            ok={handleOk}
            isNext={false}
            loading={isLoading}
            submitButtonDisabled={list.length === 0}
            className="flex-1 overflow-auto min-h-0 pb-space-md"
            maxHeight="max-h-screen"
          />
          {result ? (
            <div className="mt-space-md rounded-radius-sm border border-border-primary">
              <div className="p-space-sm text-sm text-text-secondary">JSON</div>
              <pre className="max-h-screen overflow-auto p-space-sm text-xs text-text-primary">
                {content}
              </pre>
            </div>
          ) : null}
        </section>
      </SheetContent>
    </Sheet>
  )
}
