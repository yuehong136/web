import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AgentCanvasType } from '@/types/agent'
import { cn } from '@/lib/utils'
import { BrainCircuit, Route, Sparkles } from 'lucide-react'

interface CreateAgentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: {
    title: string
    kind: AgentCanvasType
  }) => Promise<void> | void
  defaultTitle?: string
  initialKind?: AgentCanvasType
  allowKindChange?: boolean
  title?: string
  description?: string
}

const kindCards = [
  {
    value: AgentCanvasType.AGENT,
    titleKey: 'agent.center.createAgent',
    title: 'Agent workflow',
    descriptionKey: 'agent.center.createAgentDescription',
    description: 'Chat, tool calling, and multi-turn orchestration',
    icon: BrainCircuit,
    tone: 'bg-status-info-subtle text-status-info',
  },
  {
    value: AgentCanvasType.PIPELINE,
    titleKey: 'agent.center.createPipeline',
    title: 'Ingestion pipeline',
    descriptionKey: 'agent.center.createPipelineDescription',
    description: 'File parsing, chunking, extraction, and indexing',
    icon: Route,
    tone: 'bg-status-success-subtle text-status-success',
  },
]

export function CreateAgentDialog({
  open,
  onOpenChange,
  onConfirm,
  defaultTitle = '',
  initialKind = AgentCanvasType.AGENT,
  allowKindChange = true,
  title,
  description,
}: CreateAgentDialogProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(defaultTitle)
  const [kind, setKind] = useState(initialKind)
  const [submitting, setSubmitting] = useState(false)
  const [failed, setFailed] = useState(false)
  const id = useId()

  const resetInputs = [defaultTitle, initialKind, open]
  const [previousInputs, setPreviousInputs] = useState<unknown[] | null>(null)
  if (
    previousInputs === null ||
    resetInputs.some((value, index) => !Object.is(value, previousInputs[index]))
  ) {
    setPreviousInputs(resetInputs)

    if (open) {
      setName(defaultTitle)
      setKind(initialKind)
      setFailed(false)
    }
  }

  const handleConfirm = async () => {
    const nextName = name.trim()
    if (!nextName) {
      return
    }

    setSubmitting(true)
    setFailed(false)
    try {
      await onConfirm({ title: nextName, kind })
      onOpenChange(false)
    } catch {
      setFailed(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!submitting) onOpenChange(next)
      }}
    >
      <DialogContent size="lg" modal>
        <DialogHeader>
          <div className="mb-space-sm flex h-11 w-11 items-center justify-center rounded-radius-xl bg-components-studio-surface">
            <Sparkles className="h-5 w-5 text-text-accent" />
          </div>
          <DialogTitle>
            {title ?? t('agent.center.createTitle', 'Create Agent asset')}
          </DialogTitle>
          <DialogDescription>
            {description ??
              t(
                'agent.center.createDescription',
                'Choose a type and name it to start building.',
              )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-space-lg px-space-lg pb-space-lg">
          {allowKindChange ? (
            <div className="space-y-space-sm">
              <p className="text-sm font-medium text-text-primary">
                {t('agent.center.chooseAgentType', '选择智能体类型')}
              </p>
              <RadioGroup
                value={kind}
                onValueChange={(value) => setKind(value as AgentCanvasType)}
                className="grid gap-space-sm md:grid-cols-2"
                aria-label={t('agent.center.chooseAgentType', '选择智能体类型')}
              >
                {kindCards.map((item) => {
                  const Icon = item.icon
                  const active = kind === item.value

                  return (
                    <Label
                      key={item.value}
                      htmlFor={`${id}-${item.value}`}
                      className={cn(
                        'flex cursor-pointer items-center gap-space-base rounded-radius-lg border bg-transparent p-space-md transition-colors focus-within:ring-1 focus-within:ring-state-focus focus-within:outline-hidden',
                        active
                          ? 'border-state-focus bg-state-focus-subtle text-text-primary shadow-elevation-low'
                          : 'border-border-default text-text-secondary hover:border-border-strong hover:bg-surface-secondary',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-radius-lg',
                          item.tone,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base leading-tight font-semibold text-text-primary">
                          {t(item.titleKey, item.title)}
                        </p>
                        <p className="mt-space-xs text-sm leading-snug text-text-secondary">
                          {t(item.descriptionKey, item.description)}
                        </p>
                      </div>
                      <RadioGroupItem
                        id={`${id}-${item.value}`}
                        value={item.value}
                        className="shrink-0"
                      />
                    </Label>
                  )
                })}
              </RadioGroup>
            </div>
          ) : null}

          <div className="space-y-space-sm">
            <Label
              htmlFor={`${id}-name`}
              className="text-sm font-medium text-text-primary"
            >
              {t('common.name', '名称')}
            </Label>
            <Input
              id={`${id}-name`}
              value={name}
              disabled={submitting}
              onChange={(event) => setName(event.target.value)}
              placeholder={t(
                'agent.center.namePlaceholder',
                '例如：客服助手、文档分析器',
              )}
            />
          </div>
        </div>

        {failed && (
          <p role="alert" className="px-space-lg text-sm text-text-error">
            {t('agents.createFailed')}
          </p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t('common.cancel', '取消')}
          </Button>
          <Button
            onClick={() => {
              void handleConfirm()
            }}
            disabled={!name.trim()}
            loading={submitting}
          >
            {submitting
              ? t('agent.center.creating', '创建中...')
              : t('agent.center.continue', '继续')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
