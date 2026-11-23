import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation } from '@tanstack/react-query'
import { RotateCcw, Sparkles, TriangleAlert } from 'lucide-react'
import { llmAPI } from '@/api/llm'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import { cn } from '@/lib/utils'

/** `{name}`, `{node@field}`: the placeholders a rewrite must keep. */
const PLACEHOLDER = /\{[^{}\s]+\}/g

export const promptPlaceholders = (text: string) => [
  ...new Set(text.match(PLACEHOLDER) ?? []),
]

/** Placeholders of the current prompt that a suggestion dropped. */
export const missingPlaceholders = (current: string, next: string) => {
  const kept = new Set(promptPlaceholders(next))
  return promptPlaceholders(current).filter((name) => !kept.has(name))
}

const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)

/** The model the last suggestion used, for the next dialog in this visit. */
const lastModel = { current: null as string | null }
const rememberModel = (model: string) => {
  lastModel.current = model
}

interface PromptAssistProps {
  /** The prompt as it is now; empty means "write one from the task". */
  value: string
  onApply: (next: string) => void
  /** Preselects a model, e.g. the app's own chat model. */
  defaultModel?: string | null
  disabled?: boolean
  className?: string
}

/**
 * "AI 优化" for prompt toolbars (Agent nodes, Studio apps): describe a task to
 * get a prompt written, or leave it empty to refine the current one, through
 * the backend's fine_prompt. The suggestion shows beside the current prompt,
 * paragraph by paragraph, and is applied only on request; dropped
 * placeholders are named before anything is replaced.
 */
export function PromptAssist({
  value,
  onApply,
  defaultModel,
  disabled,
  className,
}: PromptAssistProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  return (
    <>
      <Button
        ref={trigger}
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        className={cn('shrink-0', className)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setOpen(true)}
        data-prompt-assist
      >
        <Sparkles className="text-ai-fg" aria-hidden="true" />
        {t('chat.promptAssist.trigger')}
      </Button>
      {open && (
        <PromptAssistDialog
          value={value}
          defaultModel={defaultModel}
          returnFocusRef={trigger}
          onClose={() => setOpen(false)}
          onApply={(next) => {
            onApply(next)
            setOpen(false)
          }}
        />
      )}
    </>
  )
}

function PromptAssistDialog({
  value,
  defaultModel,
  returnFocusRef,
  onClose,
  onApply,
}: {
  value: string
  defaultModel?: string | null
  returnFocusRef: React.RefObject<HTMLButtonElement | null>
  onClose: () => void
  onApply: (next: string) => void
}) {
  const { t } = useTranslation()
  const { myLLMs, isLoading: loading, isError, refetch } = useFetchMyLLMs()
  const [task, setTask] = useState('')
  const [model, setModel] = useState<string | null>(
    lastModel.current ?? defaultModel ?? null,
  )
  const controller = useRef<AbortController | null>(null)
  const generate = useMutation({
    mutationFn: ({ prompt, model }: { prompt: string; model: string }) => {
      controller.current?.abort()
      controller.current = new AbortController()
      return llmAPI.finePrompt({ prompt, model }, controller.current.signal)
    },
    meta: { errorFeedback: MutationErrorFeedback.Local },
  })
  const current = value.trim()
  const source = task.trim()
    ? current
      ? `${task.trim()}\n\n${t('chat.promptAssist.currentPromptHeading')}\n${current}`
      : task.trim()
    : current
  const run = () => {
    if (!model || !source) return
    rememberModel(model)
    generate.mutate({ prompt: source, model })
  }
  const close = () => {
    controller.current?.abort()
    onClose()
  }
  const suggestion = generate.data ?? ''
  const missing = suggestion ? missingPlaceholders(current, suggestion) : []
  const before = new Set(paragraphs(current))
  const after = new Set(paragraphs(suggestion))

  return (
    <Dialog open onOpenChange={(next) => !next && close()}>
      {/* Not modal: the model list portals to the body, under a top-layer dialog. */}
      <DialogContent size="xl" returnFocusRef={returnFocusRef}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-space-sm">
            <Sparkles className="size-icon-sm text-ai-fg" aria-hidden="true" />
            {t('chat.promptAssist.title')}
          </DialogTitle>
          <DialogDescription>
            {t('chat.promptAssist.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-space-md">
          <div className="grid gap-space-md sm:grid-cols-[1fr_minmax(12rem,16rem)]">
            <label className="space-y-space-xs text-sm">
              <span className="font-medium text-fg">
                {t('chat.promptAssist.taskLabel')}
              </span>
              <Textarea
                value={task}
                onChange={(event) => setTask(event.target.value)}
                placeholder={t('chat.promptAssist.taskPlaceholder')}
                rows={3}
              />
            </label>
            <div className="space-y-space-xs text-sm">
              <span className="font-medium text-fg">
                {t('chat.promptAssist.model')}
              </span>
              <ChatModelSelector
                models={myLLMs ?? {}}
                selectedModelName={model}
                onSelect={setModel}
                loading={loading}
                error={
                  isError ? t('chat.promptAssist.modelsFailed') : undefined
                }
                onRetry={refetch}
                modelTypes={['chat']}
                valueMode="nameWithProvider"
                variant="compact"
                dropdownDirection="down"
              />
            </div>
          </div>
          {!source ? (
            <p className="text-sm text-fg-muted">
              {t('chat.promptAssist.needInput')}
            </p>
          ) : null}
          {generate.isPending ? (
            <output
              className="block rounded-radius-lg border ai-glow border-line-subtle px-space-md py-space-lg text-sm"
              data-prompt-assist-state="generating"
            >
              <span className="text-shimmer">
                {t('chat.promptAssist.generating')}
              </span>
            </output>
          ) : generate.isError ? (
            <p
              role="alert"
              className="rounded-radius-md bg-danger-soft px-space-md py-space-sm text-sm text-danger-fg"
            >
              {t('chat.promptAssist.failed')}
            </p>
          ) : suggestion ? (
            <div
              className="grid gap-space-md md:grid-cols-2"
              data-prompt-assist-state="ready"
            >
              <PromptColumn
                title={t('chat.promptAssist.current')}
                parts={paragraphs(current)}
                changed={(part) => !after.has(part)}
                tone="removed"
                empty={t('chat.promptAssist.noCurrent')}
              />
              <PromptColumn
                title={t('chat.promptAssist.suggestion')}
                parts={paragraphs(suggestion)}
                changed={(part) => !before.has(part)}
                tone="added"
              />
            </div>
          ) : null}
          {missing.length ? (
            <p
              className="flex items-start gap-space-sm rounded-radius-md bg-warning-soft px-space-md py-space-sm text-sm text-warning-fg"
              data-prompt-assist-missing
            >
              <TriangleAlert
                className="mt-0.5 size-icon-sm shrink-0"
                aria-hidden="true"
              />
              {t('chat.promptAssist.missingVariables', {
                names: missing.join('、'),
              })}
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            {t('common.cancel')}
          </Button>
          {suggestion && !generate.isPending ? (
            <>
              <Button type="button" variant="outline" onClick={run}>
                <RotateCcw aria-hidden="true" />
                {t('chat.promptAssist.regenerate')}
              </Button>
              {current ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onApply(`${value.trimEnd()}\n\n${suggestion}`)}
                >
                  {t('chat.promptAssist.append')}
                </Button>
              ) : null}
              <Button type="button" onClick={() => onApply(suggestion)}>
                {t('chat.promptAssist.replace')}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              disabled={!model || !source || generate.isPending}
              onClick={run}
            >
              <Sparkles aria-hidden="true" />
              {task.trim() || !current
                ? t('chat.promptAssist.generate')
                : t('chat.promptAssist.optimize')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PromptColumn({
  title,
  parts,
  changed,
  tone,
  empty,
}: {
  title: string
  parts: string[]
  changed: (part: string) => boolean
  tone: 'added' | 'removed'
  empty?: string
}) {
  return (
    <section className="min-w-0 space-y-space-xs">
      <h3 className="text-xs font-medium text-fg-muted">{title}</h3>
      <div className="max-h-[50vh] space-y-space-sm overflow-y-auto rounded-radius-lg border border-line-subtle bg-sunken p-space-md text-sm whitespace-pre-wrap text-fg">
        {parts.length ? (
          parts.map((part, index) => (
            <p
              key={index}
              data-changed={changed(part) || undefined}
              className={cn(
                'rounded-radius-sm px-space-xs',
                changed(part) &&
                  (tone === 'added'
                    ? 'bg-success-soft'
                    : 'bg-danger-soft text-fg-muted'),
              )}
            >
              {part}
            </p>
          ))
        ) : (
          <p className="text-fg-subtle">{empty}</p>
        )}
      </div>
    </section>
  )
}
