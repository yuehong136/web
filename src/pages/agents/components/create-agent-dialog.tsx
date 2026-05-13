import { useEffect, useState } from 'react'
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
    tone: 'bg-state-info-subtle text-state-info',
  },
  {
    value: AgentCanvasType.PIPELINE,
    titleKey: 'agent.center.createPipeline',
    title: 'Ingestion pipeline',
    descriptionKey: 'agent.center.createPipelineDescription',
    description: 'File parsing, chunking, extraction, and indexing',
    icon: Route,
    tone: 'bg-state-success-subtle text-state-success',
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

  useEffect(() => {
    if (open) {
      setName(defaultTitle)
      setKind(initialKind)
    }
  }, [defaultTitle, initialKind, open])

  const handleConfirm = async () => {
    const nextName = name.trim()
    if (!nextName) {
      return
    }

    setSubmitting(true)
    try {
      await onConfirm({ title: nextName, kind })
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="mb-space-sm rounded-radius-xl flex h-11 w-11 items-center justify-center bg-components-studio-surface">
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

        <div className="gap-space-lg px-space-lg pb-space-lg flex flex-col">
          {allowKindChange ? (
            <div className="space-y-space-sm">
              <p className="text-sm font-medium text-text-primary">
                {t('agent.center.chooseAgentType', '选择智能体类型')}
              </p>
              <RadioGroup
                value={kind}
                onValueChange={(value) => setKind(value as AgentCanvasType)}
                className="gap-space-sm grid md:grid-cols-2"
                aria-label={t('agent.center.chooseAgentType', '选择智能体类型')}
              >
                {kindCards.map((item) => {
                  const Icon = item.icon
                  const active = kind === item.value

                  return (
                    <label
                      key={item.value}
                      className={cn(
                        'gap-space-base rounded-radius-lg p-space-md flex cursor-pointer items-center border bg-transparent transition-colors focus-within:outline-none focus-within:ring-1 focus-within:ring-state-focus',
                        active
                          ? 'shadow-elevation-low border-state-focus bg-state-focus-subtle text-text-primary'
                          : 'hover:bg-surface-secondary border-border-default text-text-secondary hover:border-border-strong',
                      )}
                    >
                      <div
                        className={cn(
                          'rounded-radius-lg flex h-10 w-10 shrink-0 items-center justify-center',
                          item.tone,
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold leading-tight text-text-primary">
                          {t(item.titleKey, item.title)}
                        </p>
                        <p className="mt-space-xs text-sm leading-snug text-text-secondary">
                          {t(item.descriptionKey, item.description)}
                        </p>
                      </div>
                      <RadioGroupItem value={item.value} className="shrink-0" />
                    </label>
                  )
                })}
              </RadioGroup>
            </div>
          ) : null}

          <div className="space-y-space-sm">
            <label
              htmlFor="agent-title"
              className="text-sm font-medium text-text-primary"
            >
              {t('common.name', '名称')}
            </label>
            <Input
              id="agent-title"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t(
                'agent.center.namePlaceholder',
                '例如：客服助手、文档分析器',
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', '取消')}
          </Button>
          <Button onClick={handleConfirm} disabled={!name.trim() || submitting}>
            {submitting
              ? t('agent.center.creating', '创建中...')
              : t('agent.center.continue', '继续')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
