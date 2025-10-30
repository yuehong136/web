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
import { Workflow, Database, Check, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateAgentDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (title: string, canvasType: 'agent' | 'pipeline') => void
}

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
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            创建智能体
          </DialogTitle>
          <DialogDescription className="text-base">
            选择智能体类型并为其命名，开始构建你的AI工作流
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* 类型选择 */}
          <div>
            <Label className="text-base font-semibold mb-4 block">
              <span className="text-destructive mr-1">*</span>
              选择智能体类型
            </Label>
            <div className="grid grid-cols-2 gap-4">
              {/* 智能体流程 */}
              <button
                onClick={() => setSelectedType('agent')}
                className={cn(
                  'relative p-6 rounded-xl border-2 transition-all text-left group',
                  'hover:shadow-lg hover:scale-[1.02]',
                  selectedType === 'agent'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-lg shadow-blue-500/20'
                    : 'border-border hover:border-blue-300',
                )}
              >
                {selectedType === 'agent' && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Workflow className="w-7 h-7 text-white" />
                </div>
                
                <div className="font-semibold text-foreground mb-2 text-lg">
                  智能体流程
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  创建对话式AI工作流，支持检索、生成、多轮对话等功能
                </div>
              </button>

              {/* Ingestion Pipeline */}
              <button
                onClick={() => setSelectedType('pipeline')}
                className={cn(
                  'relative p-6 rounded-xl border-2 transition-all text-left group',
                  'hover:shadow-lg hover:scale-[1.02]',
                  selectedType === 'pipeline'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30 shadow-lg shadow-green-500/20'
                    : 'border-border hover:border-green-300',
                )}
              >
                {selectedType === 'pipeline' && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Database className="w-7 h-7 text-white" />
                </div>
                
                <div className="font-semibold text-foreground mb-2 text-lg">
                  Ingestion Pipeline
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  创建数据处理管道，支持文件解析、分块、向量化等
                </div>
              </button>
            </div>
          </div>

          {/* 名称输入 */}
          <div>
            <Label htmlFor="agent-name" className="text-base font-semibold mb-3 block">
              <span className="text-destructive mr-1">*</span>
              智能体名称
            </Label>
            <Input
              id="agent-name"
              placeholder="请输入名称，例如：客服助手、文档分析器"
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
              className="text-base h-11"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              给你的智能体起一个清晰、描述性的名称
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} className="min-w-24">
            取消
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="min-w-24 gap-2"
          >
            <Sparkles className="w-4 h-4" />
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
