/**
 * Designer「试运行」对话框:选模型 + 粘样本源料(+ 若骨架引用了变量则填样本值)→ 逐节
 * 调 LLM 真填值 → 用 ReportFrame 出一份真报告。验证骨架到报告的整条链路,不写回画布。
 *
 * 同 AiSkeletonDialog:渲染成 Designer Sheet 内部覆盖层(absolute inset-0),不 portal 到
 * body——Designer 是 Radix 模态 Sheet,portal 弹窗会被 pointer-events:none 挡住并误触外部关闭。
 */
import { Loader2, Play, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useChatModelOptions } from '@/hooks/use-llm-request'
import { ReportFrame } from '../report-frame'
import type { SkeletonSchema } from '../types'
import { ModelSelect } from './ai-skeleton/model-select'
import { useRunFill } from './use-run-fill'

interface RunDialogProps {
  open: boolean
  skeleton: SkeletonSchema
  onClose: () => void
}

export function RunDialog({ open, skeleton, onClose }: RunDialogProps) {
  const { t } = useTranslation()
  const { options, isLoading } = useChatModelOptions()
  const [model, setModel] = useState('')
  const [text, setText] = useState('')
  const [samples, setSamples] = useState<Record<string, string>>({})
  const { run, cancel, status, progress, result, failedSections } = useRunFill()
  const busy = status === 'running'
  const showResult = status === 'done' && result !== null

  // 骨架里被 variable 引用到的上游变量(当前 Inspector 未开放 variable,通常为空)
  const variableRefs = useMemo(() => {
    const refs = new Set<string>()
    for (const section of skeleton.sections) {
      for (const block of section.blocks) {
        for (const directive of Object.values(block.fieldDirectives ?? {})) {
          if (directive.mode === 'variable' && directive.ref) {
            refs.add(directive.ref)
          }
        }
      }
    }
    return [...refs]
  }, [skeleton])

  // 模型清单到达后默认选首个
  useEffect(() => {
    if (!model && options.length > 0) setModel(options[0].value)
  }, [options, model])

  // 关闭时复位(取消在途流、回到表单态)
  useEffect(() => {
    if (!open) cancel()
  }, [open, cancel])

  useEffect(() => {
    if (status === 'error') {
      toast.error(t('flow.htmlReportRunError', 'Trial run failed'))
    }
  }, [status, t])

  if (!open) return null

  const handleRun = () => {
    if (!text.trim()) {
      toast.error(
        t('flow.htmlReportRunEmpty', 'Paste some sample source text first'),
      )
      return
    }
    if (!model) return
    run({
      skeleton,
      sourceText: text,
      llmName: model,
      resolveRef: (ref) => samples[ref],
    })
  }

  return (
    <dialog
      open
      aria-modal="true"
      aria-label={t('flow.htmlReportRunTitle', 'Trial run')}
      className="p-space-lg absolute inset-0 z-20 m-0 flex h-full w-full max-w-none items-center justify-center border-0 bg-transparent"
    >
      {busy ? (
        <div className="absolute inset-0 bg-background-overlay backdrop-blur-sm" />
      ) : (
        <button
          type="button"
          aria-label={t('common.close', 'Close')}
          className="absolute inset-0 bg-background-overlay backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={`rounded-radius-lg shadow-elevation-high relative z-10 flex max-h-full w-full max-w-3xl flex-col overflow-hidden border border-border-default bg-background-surface ${
          showResult ? 'h-[80vh]' : ''
        }`}
      >
        <div className="px-space-lg pt-space-lg pb-space-sm shrink-0">
          <div className="gap-space-sm flex items-start justify-between">
            <h2 className="text-base font-semibold text-text-primary">
              {t('flow.htmlReportRunTitle', 'Trial run')}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label={t('common.close', 'Close')}
              className="text-text-caption hover:text-text-primary disabled:opacity-50"
            >
              <X className="size-icon-sm" />
            </button>
          </div>
          <p className="mt-space-2xs text-sm text-text-secondary">
            {t(
              'flow.htmlReportRunDesc',
              'Fill the template with sample input to preview a real report.',
            )}
          </p>
        </div>

        {showResult ? (
          <div className="min-h-0 flex-1">
            <ReportFrame
              schema={result}
              title={t('flow.htmlReportRunResult', 'Trial run result')}
            />
          </div>
        ) : (
          <div className="space-y-space-md px-space-lg pb-space-md min-h-0 flex-1 overflow-auto">
            <div className="space-y-space-xs">
              <Label className="text-xs text-text-secondary">
                {t('flow.htmlReportAiModel', 'Model')}
              </Label>
              <ModelSelect
                value={model}
                options={options}
                disabled={busy || isLoading || options.length === 0}
                placeholder={t(
                  'flow.htmlReportAiModelEmpty',
                  'No chat model available',
                )}
                onChange={setModel}
              />
            </div>

            <div className="space-y-space-xs">
              <Label className="text-xs text-text-secondary">
                {t('flow.htmlReportRunSource', 'Sample source text')}
              </Label>
              <Textarea
                rows={10}
                value={text}
                disabled={busy}
                placeholder={t(
                  'flow.htmlReportRunSourcePlaceholder',
                  'Paste sample upstream text the model should fill from…',
                )}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {variableRefs.length > 0 && (
              <div className="space-y-space-xs">
                <Label className="text-xs text-text-secondary">
                  {t('flow.htmlReportRunVariables', 'Sample variable values')}
                </Label>
                {variableRefs.map((ref) => (
                  <div key={ref} className="gap-space-xs flex items-center">
                    <code className="text-text-caption shrink-0 text-xs">
                      {ref}
                    </code>
                    <Input
                      inputSize="sm"
                      value={samples[ref] ?? ''}
                      disabled={busy}
                      onChange={(e) =>
                        setSamples((prev) => ({
                          ...prev,
                          [ref]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {busy && (
              <div
                className="gap-space-xs text-text-caption flex items-center text-xs"
                aria-live="polite"
                aria-busy="true"
              >
                <Loader2 className="size-icon-sm animate-spin" />
                <span>
                  {progress.total > 0
                    ? t('flow.htmlReportRunProgress', {
                        current: progress.current,
                        total: progress.total,
                        defaultValue: 'Filling section {{current}}/{{total}}…',
                      })
                    : t('flow.htmlReportRunStarting', 'Starting…')}
                </span>
              </div>
            )}

            {status === 'error' && (
              <p className="text-xs text-status-error" role="alert">
                {t('flow.htmlReportRunError', 'Trial run failed')}
              </p>
            )}
          </div>
        )}

        <div className="gap-space-sm px-space-lg py-space-base flex shrink-0 items-center justify-end border-t border-border-subtle">
          {showResult && failedSections > 0 && (
            <span className="mr-auto text-xs text-status-warning">
              {t('flow.htmlReportRunPartial', {
                count: failedSections,
                defaultValue: '{{count}} section(s) could not be filled',
              })}
            </span>
          )}
          {busy ? (
            <Button variant="outline" size="sm" onClick={cancel}>
              {t('flow.htmlReportAiCancel', 'Cancel')}
            </Button>
          ) : showResult ? (
            <Button variant="outline" size="sm" onClick={cancel}>
              {t('flow.htmlReportRunBack', 'Back to inputs')}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t('common.close', 'Close')}
            </Button>
          )}
          {!showResult && (
            <Button
              variant="default"
              size="sm"
              disabled={busy || !text.trim() || !model}
              leftIcon={
                busy ? (
                  <Loader2 className="size-icon-sm animate-spin" />
                ) : (
                  <Play className="size-icon-sm" />
                )
              }
              onClick={handleRun}
            >
              {busy
                ? t('flow.htmlReportRunRunning', 'Running…')
                : t('flow.htmlReportRunStart', 'Run')}
            </Button>
          )}
        </div>
      </div>
    </dialog>
  )
}
