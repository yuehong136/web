import { useEffect, useState } from 'react'
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
  onConfirm: (payload: { title: string; kind: AgentCanvasType }) => Promise<void> | void
  defaultTitle?: string
  initialKind?: AgentCanvasType
  allowKindChange?: boolean
  title?: string
  description?: string
}

const kindCards = [
  {
    value: AgentCanvasType.AGENT,
    title: '智能体流程',
    description: '对话、工具调用、多轮任务编排',
    icon: BrainCircuit,
    tone: 'bg-state-info-subtle text-state-info',
  },
  {
    value: AgentCanvasType.PIPELINE,
    title: 'Ingestion pipeline',
    description: '文件解析、分块、抽取与索引',
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
  title = '创建新的 Agent 资产',
  description = '选择类型并命名，开始构建 AI 工作流。',
}: CreateAgentDialogProps) {
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
          <div className="mb-space-sm flex h-11 w-11 items-center justify-center rounded-radius-xl bg-components-studio-surface">
            <Sparkles className="h-5 w-5 text-text-accent" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-space-lg px-space-lg pb-space-lg">
          {allowKindChange ? (
            <div className="space-y-space-sm">
              <p className="text-sm font-medium text-text-primary">选择智能体类型</p>
              <RadioGroup
                value={kind}
                onValueChange={(value) => setKind(value as AgentCanvasType)}
                className="grid gap-space-sm md:grid-cols-2"
                aria-label="选择智能体类型"
              >
                {kindCards.map((item) => {
                  const Icon = item.icon
                  const active = kind === item.value

                  return (
                    <label
                      key={item.value}
                      className={cn(
                        'flex cursor-pointer items-center gap-space-base rounded-radius-lg border bg-transparent p-space-md transition-colors focus-within:outline-none focus-within:ring-1 focus-within:ring-state-focus',
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
                        <p className="text-base font-semibold leading-tight text-text-primary">
                          {item.title}
                        </p>
                        <p className="mt-space-xs text-sm leading-snug text-text-secondary">
                          {item.description}
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
            <label htmlFor="agent-title" className="text-sm font-medium text-text-primary">
              名称
            </label>
            <Input
              id="agent-title"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：客服助手、文档分析器"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!name.trim() || submitting}>
            {submitting ? '创建中...' : '继续'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
