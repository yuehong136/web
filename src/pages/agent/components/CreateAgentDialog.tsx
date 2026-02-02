/**
 * 创建智能体弹窗
 * 现代化 AI 产品风格设计
 */

import { useState } from 'react'
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
import { Workflow, Database, Check, ArrowRight, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateAgentDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (title: string, canvasType: 'agent' | 'pipeline') => void
}

const agentTypes = [
  {
    type: 'agent' as const,
    title: '智能体流程',
    description: '创建对话式 AI 工作流，支持检索、生成、多轮对话等功能',
    icon: Workflow,
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
    ringColor: 'ring-violet-500',
    checkBg: 'bg-violet-500',
  },
  {
    type: 'pipeline' as const,
    title: 'Ingestion Pipeline',
    description: '创建数据处理管道，支持文件解析、分块、向量化等',
    icon: Database,
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-600',
    ringColor: 'ring-emerald-500',
    checkBg: 'bg-emerald-500',
  },
]

export const CreateAgentDialog = ({
  open,
  onClose,
  onCreate,
}: CreateAgentDialogProps) => {
  const [selectedType, setSelectedType] = useState<'agent' | 'pipeline'>('agent')
  const [title, setTitle] = useState('')

  const handleCreate = () => {
    if (!title.trim()) {
      return
    }
    onCreate(title.trim(), selectedType)
    setTitle('')
    setSelectedType('agent')
    onClose()
  }

  const handleClose = () => {
    setTitle('')
    setSelectedType('agent')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="md" className="overflow-hidden">
        <DialogHeader className="pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold text-text-primary">
                创建智能体
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                选择类型并命名，开始构建 AI 工作流
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* 类型选择 */}
          <div>
            <Label className="text-sm font-medium text-text-primary mb-3 block">
              选择类型
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {agentTypes.map((agentType) => {
                const Icon = agentType.icon
                const isSelected = selectedType === agentType.type
                
                return (
                  <button
                    key={agentType.type}
                    type="button"
                    onClick={() => setSelectedType(agentType.type)}
                    className={cn(
                      'relative p-4 rounded-xl text-left transition-all duration-200',
                      'border-2',
                      isSelected
                        ? `border-transparent ring-2 ${agentType.ringColor} bg-[var(--color-surface-secondary)]`
                        : 'border-border-default hover:border-border-hover hover:bg-[var(--color-surface-secondary)]/50'
                    )}
                  >
                    {/* 选中标记 */}
                    {isSelected && (
                      <div className={cn(
                        'absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center',
                        agentType.checkBg
                      )}>
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}

                    {/* 图标 */}
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center mb-3',
                      'bg-gradient-to-br shadow-md',
                      agentType.gradientFrom,
                      agentType.gradientTo,
                      isSelected ? 'scale-105' : '',
                      'transition-transform duration-200'
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* 标题 */}
                    <div className="font-medium text-text-primary text-sm mb-1">
                      {agentType.title}
                    </div>
                    
                    {/* 描述 */}
                    <div className="text-xs text-text-tertiary leading-relaxed line-clamp-2">
                      {agentType.description}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 名称输入 */}
          <div>
            <Label htmlFor="agent-name" className="text-sm font-medium text-text-primary mb-2 block">
              名称
            </Label>
            <Input
              id="agent-name"
              placeholder="例如：客服助手、文档分析器"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && title.trim()) {
                  handleCreate()
                }
                if (e.key === 'Escape') {
                  handleClose()
                }
              }}
              autoFocus
            />
            <p className="text-xs text-text-tertiary mt-1.5">
              给智能体起一个清晰、描述性的名称
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            取消
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="gap-1.5"
          >
            创建
            <ArrowRight className="w-4 h-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
