import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { RAGFlowNodeType } from '../types'

interface FormSheetProps {
  open: boolean
  node: RAGFlowNodeType | undefined
  onClose: () => void
}

export const FormSheet = ({ open, node, onClose }: FormSheetProps) => {
  if (!node) return null

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl">{node.data.name}</SheetTitle>
              <SheetDescription className="mt-1">
                {node.data.label} 节点配置
              </SheetDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* 基础信息 */}
          <div className="rounded-lg border border-border p-4 bg-muted/30">
            <div className="text-sm font-medium mb-2">节点信息</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono text-xs">{node.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">类型:</span>
                <span>{node.data.label}</span>
              </div>
            </div>
          </div>

          {/* 表单内容 - 根据节点类型显示 */}
          <div className="space-y-4">
            <div className="text-sm font-medium">配置参数</div>
            
            {/* TODO: 根据节点类型渲染不同的表单 */}
            <div className="rounded-lg border border-border p-4">
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(node.data.form, null, 2)}
              </pre>
            </div>
            
            <div className="text-xs text-muted-foreground">
              节点属性编辑功能开发中...
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              关闭
            </Button>
            <Button className="flex-1">
              保存
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

