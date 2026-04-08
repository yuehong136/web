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
import { AgentCanvasType } from '@/types/agent'
import { cn } from '@/lib/utils'
import { Bot, Database, Sparkles } from 'lucide-react'

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
    title: 'Agent',
    description: '对话、工具调用、结构化输出、会话探索。',
    icon: Bot,
    tone: 'bg-state-info-subtle text-state-info',
  },
  {
    value: AgentCanvasType.PIPELINE,
    title: 'Pipeline',
    description: '文件解析、切分、抽取、后处理与数据流运行。',
    icon: Database,
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
  description = '第一阶段先落正确骨架，后续再持续充实节点配置和运行细节。',
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
            <div className="grid gap-space-sm md:grid-cols-2">
              {kindCards.map((item) => {
                const Icon = item.icon
                const active = kind === item.value

                return (
                  <button
                    key={item.value}
                    type="button"
                    className={cn(
                      'rounded-radius-xl border p-space-lg text-left transition-colors',
                      active
                        ? 'border-state-focus bg-surface-secondary'
                        : 'border-border-default hover:border-border-strong hover:bg-surface-secondary',
                    )}
                    onClick={() => setKind(item.value)}
                  >
                    <div className={cn('mb-space-sm flex h-10 w-10 items-center justify-center rounded-radius-lg', item.tone)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mb-space-xs text-base font-semibold text-text-primary">
                      {item.title}
                    </p>
                    <p className="text-sm text-text-secondary">{item.description}</p>
                  </button>
                )
              })}
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
              placeholder="例如：企业知识助理 / 文档清洗流水线"
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
