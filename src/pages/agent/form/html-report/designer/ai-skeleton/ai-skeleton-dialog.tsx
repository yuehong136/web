/**
 * 「AI 从报告文本生成骨架」对话框:选模型 + 粘贴报告全文 → 流式生成 → 回写草稿。
 * 产物是组件骨架(SkeletonSchema),生成成功后由父组件 reset 整个画布。
 *
 * 注意:这里渲染成 Designer Sheet **内部**的覆盖层(absolute inset-0),而非
 * portal 到 body 的弹窗。Designer 是 Radix 模态 Sheet,会把 body 设成
 * pointer-events:none 并把 body 外点击当作「外部点击」——若用 portal 弹窗,既点不动
 * 又会误关 Sheet。留在 Sheet 子树内即可正常交互、焦点也由 Sheet 的 FocusScope 兜住。
 */
import { Loader2, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useChatModelOptions } from '@/hooks/use-llm-request'
import type { SkeletonSchema } from '../../types'
import { ModelSelect } from './model-select'
import { useGenerateSkeleton } from './use-generate-skeleton'

interface AiSkeletonDialogProps {
  open: boolean
  /** 当前画布是否已有内容(决定是否提示「将被替换」) */
  hasContent: boolean
  onGenerated: (skeleton: SkeletonSchema) => void
  onClose: () => void
}

export function AiSkeletonDialog({
  open,
  hasContent,
  onGenerated,
  onClose,
}: AiSkeletonDialogProps) {
  const { t } = useTranslation()
  const { options, isLoading } = useChatModelOptions()
  const [text, setText] = useState('')
  const [model, setModel] = useState('')

  const { generate, cancel, status, progress, error } = useGenerateSkeleton(
    (skeleton) => {
      toast.success(t('flow.htmlReportAiSuccess', 'Skeleton generated'))
      onGenerated(skeleton)
    },
  )
  const streaming = status === 'streaming'

  // 模型清单到达后默认选首个
  useEffect(() => {
    if (!model && options.length > 0) setModel(options[0].value)
  }, [options, model])

  // 失败时 toast(内联文案同时保留)
  useEffect(() => {
    if (status !== 'error' || !error) return
    toast.error(
      error === 'parse'
        ? t(
            'flow.htmlReportAiErrorParse',
            'Could not parse the model output, please try again',
          )
        : t('flow.htmlReportAiErrorGeneric', 'Generation failed'),
    )
  }, [status, error, t])

  if (!open) return null

  const close = () => {
    if (streaming) cancel()
    onClose()
  }

  const handleGenerate = () => {
    if (!text.trim()) {
      toast.error(
        t('flow.htmlReportAiEmpty', 'Please paste the report text first'),
      )
      return
    }
    if (model) generate(text, model)
  }

  return (
    <dialog
      open
      aria-modal="true"
      aria-label={t(
        'flow.htmlReportAiDialogTitle',
        'Generate from report text',
      )}
      className="p-space-lg absolute inset-0 z-20 m-0 flex h-full w-full max-w-none items-center justify-center border-0 bg-transparent"
    >
      {streaming ? (
        <div className="absolute inset-0 bg-background-overlay backdrop-blur-sm" />
      ) : (
        <button
          type="button"
          aria-label={t('common.close', 'Close')}
          className="absolute inset-0 bg-background-overlay backdrop-blur-sm"
          onClick={close}
        />
      )}

      <div className="rounded-radius-lg shadow-elevation-high relative z-10 flex max-h-full w-full max-w-3xl flex-col overflow-hidden border border-border-default bg-background-surface">
        <div className="px-space-lg pt-space-lg pb-space-sm shrink-0">
          <div className="gap-space-sm flex items-start justify-between">
            <h2 className="text-base font-semibold text-text-primary">
              {t('flow.htmlReportAiDialogTitle', 'Generate from report text')}
            </h2>
            <button
              type="button"
              onClick={close}
              disabled={streaming}
              aria-label={t('common.close', 'Close')}
              className="text-text-caption hover:text-text-primary disabled:opacity-50"
            >
              <X className="size-icon-sm" />
            </button>
          </div>
          <p className="mt-space-2xs text-sm text-text-secondary">
            {t(
              'flow.htmlReportAiDialogDesc',
              'Paste a complete report; the model builds the report structure for you.',
            )}
          </p>
        </div>

        <div className="space-y-space-md px-space-lg pb-space-md min-h-0 flex-1 overflow-auto">
          <div className="space-y-space-xs">
            <Label className="text-xs text-text-secondary">
              {t('flow.htmlReportAiModel', 'Model')}
            </Label>
            <ModelSelect
              value={model}
              options={options}
              disabled={streaming || isLoading || options.length === 0}
              placeholder={t(
                'flow.htmlReportAiModelEmpty',
                'No chat model available',
              )}
              onChange={setModel}
            />
          </div>

          <div className="space-y-space-xs">
            <Label className="text-xs text-text-secondary">
              {t('flow.htmlReportAiSource', 'Report text')}
            </Label>
            <Textarea
              rows={12}
              value={text}
              disabled={streaming}
              placeholder={t(
                'flow.htmlReportAiSourcePlaceholder',
                'Paste the full report text here…',
              )}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {hasContent && !streaming && (
            <p className="text-xs text-status-warning">
              {t(
                'flow.htmlReportAiReplaceWarn',
                'Generating will replace the current canvas content',
              )}
            </p>
          )}

          {streaming && (
            <div
              className="gap-space-xs text-text-caption flex items-center text-xs"
              aria-live="polite"
              aria-busy="true"
            >
              <Loader2 className="size-icon-sm animate-spin" />
              <span>
                {progress.length > 0
                  ? t('flow.htmlReportAiReceived', {
                      count: progress.length,
                      defaultValue: 'Building the report… ({{count}} chars)',
                    })
                  : t('flow.htmlReportAiGenerating', 'Generating…')}
              </span>
            </div>
          )}

          {status === 'error' && error && (
            <p className="text-xs text-status-error" role="alert">
              {error === 'parse'
                ? t(
                    'flow.htmlReportAiErrorParse',
                    'Could not parse the model output, please try again',
                  )
                : t('flow.htmlReportAiErrorGeneric', 'Generation failed')}
            </p>
          )}
        </div>

        <div className="gap-space-sm px-space-lg py-space-base flex shrink-0 items-center justify-end border-t border-border-subtle">
          {streaming ? (
            <Button variant="outline" size="sm" onClick={cancel}>
              {t('flow.htmlReportAiCancel', 'Cancel')}
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={close}>
              {t('common.close', 'Close')}
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            disabled={streaming || !text.trim() || !model}
            leftIcon={
              streaming ? (
                <Loader2 className="size-icon-sm animate-spin" />
              ) : (
                <Sparkles className="size-icon-sm" />
              )
            }
            onClick={handleGenerate}
          >
            {streaming
              ? t('flow.htmlReportAiGenerating', 'Generating…')
              : t('flow.htmlReportAiRun', 'Generate')}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
