import { useCallback, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useDebugSingle, useFetchInputForm } from '@/hooks/use-agent-request'
import { cn } from '@/lib/utils'
import { toast } from '@/lib/toast'
import {
  Activity,
  AlertCircle,
  Braces,
  CheckCircle2,
  FileText,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import DebugContent from '../../../debug-content'
import { buildBeginInputListFromObject } from '../../../hooks/use-get-begin-query'
import useGraphStore from '../../../store'
import type { BeginQuery } from '../../../types'
import { coerceBeginInputOrder } from '../../../utils/begin-input-order'
import { deserializeCodeOutputContract } from '../../../utils/code-outputs'
import { TraceJsonViewer } from '../../trace-workbench/components/trace-json-viewer'
import {
  groupCodeExecDebugOutput,
  shouldUseCodeExecDebugLayout,
} from '../utils'

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

interface DebugDataEnvelope {
  data?: unknown
  retcode?: number
  code?: number
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isEmptyDebugValue(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return true
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  if (typeof value === 'object') {
    return Object.keys(value).length === 0
  }

  return false
}

function resolveDebugPayload(result: unknown) {
  if (!isRecord(result)) {
    return result
  }

  const envelope = result as DebugDataEnvelope
  const looksLikeEnvelope =
    typeof envelope.retcode === 'number' || typeof envelope.code === 'number'

  if (looksLikeEnvelope && 'data' in envelope) {
    return envelope.data
  }

  return result
}

function DebugMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value?: string
  tone?: 'default' | 'success' | 'error'
}) {
  return (
    <div
      className={cn(
        'rounded-radius-md bg-surface-primary px-space-sm py-space-xs min-w-0 border',
        tone === 'success' && 'border-status-success-border',
        tone === 'error' && 'border-status-error-border',
        tone === 'default' && 'border-border-subtle',
      )}
    >
      <div className="text-xs leading-5 text-text-tertiary">{label}</div>
      <div className="truncate text-sm font-semibold text-text-primary">
        {value || '-'}
      </div>
    </div>
  )
}

function CodeExecDebugInspector({
  result,
  componentId,
}: {
  result: unknown
  componentId?: string
}) {
  const { t } = useTranslation()
  const node = useGraphStore((state) => state.getNode(componentId))
  const debugPayload = resolveDebugPayload(result)
  const debugData = isRecord(debugPayload) ? debugPayload : undefined
  const formData = isRecord(node?.data?.form)
    ? (node?.data?.form as { outputs?: Record<string, { type?: string }> })
    : undefined
  const { contract } = useMemo(
    () => deserializeCodeOutputContract(formData),
    [formData],
  )
  const grouped = useMemo(
    () => groupCodeExecDebugOutput(debugData, contract),
    [contract, debugData],
  )
  const hasError = !isEmptyDebugValue(grouped.systemOutputs._ERROR)
  const hasPayload = !isEmptyDebugValue(debugPayload)

  return (
    <div className="mt-space-md space-y-space-base">
      <section
        className={cn(
          'rounded-radius-lg bg-surface-secondary p-space-base border',
          hasError ? 'border-status-error-border' : 'border-border-subtle',
        )}
      >
        <div className="mb-space-base gap-space-base flex items-start justify-between">
          <div className="gap-space-sm flex min-w-0 items-start">
            <span
              className={cn(
                'rounded-radius-md mt-0.5 flex size-9 shrink-0 items-center justify-center',
                hasError
                  ? 'bg-status-error-bg text-status-error-text'
                  : 'bg-status-success-bg text-status-success-text',
              )}
            >
              {hasError ? (
                <AlertCircle className="size-4" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
            </span>
            <div className="min-w-0">
              <h4 className="text-base font-semibold text-text-primary">
                {t('flow.codeRunInspector', 'Code run inspector')}
              </h4>
              <p className="text-sm leading-6 text-text-secondary">
                {t(
                  'flow.codeRunInspectorTip',
                  'Business value, type metadata, logs, and raw payload from this run.',
                )}
              </p>
            </div>
          </div>
          <Badge variant={hasError ? 'destructive' : 'success'}>
            {hasError
              ? t('flow.failed', 'Failed')
              : t('flow.succeeded', 'Succeeded')}
          </Badge>
        </div>

        <div className="gap-space-sm grid sm:grid-cols-2">
          <DebugMetric
            label={t('flow.businessOutput', 'Business output')}
            value={grouped.businessOutputName}
          />
          <DebugMetric
            label={t('flow.expectedType', 'Expected type')}
            value={grouped.expectedType}
          />
          <DebugMetric
            label={t('flow.actualType', 'Actual type')}
            value={grouped.actualType}
            tone={hasError ? 'error' : 'success'}
          />
          <DebugMetric
            label={t('flow.resultStatus', 'Status')}
            value={
              hasError
                ? t('flow.error', 'Error')
                : hasPayload
                  ? t('flow.ready', 'Ready')
                  : t('flow.empty', 'Empty')
            }
            tone={hasError ? 'error' : 'success'}
          />
        </div>
      </section>

      {grouped.hasBusinessOutput ? (
        <TraceJsonViewer
          title={t('flow.businessOutputValue', 'Business output value')}
          value={grouped.businessOutputValue}
          emptyLabel={t('flow.emptyValue', 'No value')}
          icon={Braces}
          height={260}
        />
      ) : null}

      <TraceJsonViewer
        title={t('flow.rawResult', 'Raw result')}
        value={grouped.rawResult}
        emptyLabel={t('flow.emptyValue', 'No value')}
        icon={Activity}
        height={260}
      />
      <TraceJsonViewer
        title={t('flow.content', 'Content')}
        value={grouped.content}
        emptyLabel={t('flow.noContent', 'No content')}
        icon={FileText}
        height={220}
      />
      <TraceJsonViewer
        title={t('flow.systemOutputs', 'System outputs')}
        value={grouped.systemOutputs}
        emptyLabel={t('flow.noSystemOutputs', 'No system outputs')}
        icon={Activity}
        height={260}
      />
      <TraceJsonViewer
        title={t('flow.rawComponentOutput', 'Raw component output')}
        value={debugPayload}
        emptyLabel={t('flow.emptyValue', 'No value')}
        icon={FileText}
        height={360}
      />
    </div>
  )
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
  const nodeLabel = useGraphStore(
    (state) => state.getNode(componentId)?.data?.label,
  )
  const shouldUseCodeExecLayout = shouldUseCodeExecDebugLayout(nodeLabel)

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
            shouldUseCodeExecLayout ? (
              <CodeExecDebugInspector
                result={result}
                componentId={componentId}
              />
            ) : (
              <div className="mt-space-md rounded-radius-md border-border-primary bg-surface-secondary border">
                <div className="border-border-primary px-space-sm py-space-xs border-b text-sm text-text-secondary">
                  JSON
                </div>
                <pre className="p-space-sm max-h-screen overflow-auto text-xs text-text-primary">
                  {serializedResult}
                </pre>
              </div>
            )
          ) : null}
        </section>
      </SheetContent>
    </Sheet>
  )
}
