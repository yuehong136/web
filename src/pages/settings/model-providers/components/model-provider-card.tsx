import React, { useState, useCallback } from 'react'
import { ChevronDown, ChevronUp, Settings, Trash2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { cn } from '@/lib/utils'
import type { MyLLMModel } from '@/stores/model'

// 模型类型标签排序
type TagType = 'LLM' | 'TEXT EMBEDDING' | 'TEXT RE-RANK' | 'TTS' | 'SPEECH2TEXT' | 'IMAGE2TEXT' | 'MODERATION'

const TAG_ORDER: Record<TagType, number> = {
  'LLM': 1,
  'TEXT EMBEDDING': 2,
  'TEXT RE-RANK': 3,
  'TTS': 4,
  'SPEECH2TEXT': 5,
  'IMAGE2TEXT': 6,
  'MODERATION': 7
}

const sortTags = (tags: string): string[] => {
  return tags
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
    .sort((a, b) => (TAG_ORDER[a as TagType] || 999) - (TAG_ORDER[b as TagType] || 999))
}

// 判断是否是本地模型厂商
const isLocalFactory = (name: string): boolean => {
  const localFactories = ['Ollama', 'Xinference', 'LocalAI', 'LM-Studio', 'GPUStack', 'VLLM', 'ModelScope']
  return localFactories.includes(name)
}

interface ModelProviderCardProps {
  name: string
  tags: string
  llm: MyLLMModel[]
  onApiKeyClick: (name: string) => void
  onDeleteClick: (name: string) => void
  onEditModel?: (model: MyLLMModel, providerName: string) => void
  onEnableModel?: (modelName: string, providerName: string, enabled: boolean) => void
}

export const ModelProviderCard: React.FC<ModelProviderCardProps> = ({
  name,
  tags,
  llm,
  onApiKeyClick,
  onDeleteClick,
  onEditModel,
  onEnableModel
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const handleApiKeyClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onApiKeyClick(name)
  }, [name, onApiKeyClick])

  const handleDeleteConfirm = useCallback(() => {
    onDeleteClick(name)
    setShowDeleteDialog(false)
  }, [name, onDeleteClick])
  
  const sortedTags = sortTags(tags)
  const isLocal = isLocalFactory(name)

  return (
    <>
      <div className="w-full rounded-lg border border-border bg-background">
        {/* 卡片头部 */}
        <div className="flex h-16 items-center justify-between px-4 cursor-pointer transition-colors hover:bg-accent/5">
          <div className="flex items-center gap-3" onClick={handleToggleExpand}>
            {/* 供应商图标 - 使用 ProviderIcon 组件 */}
            <div className="w-10 h-10 bg-background rounded-lg border border-border flex items-center justify-center overflow-hidden">
              <ProviderIcon provider={name} className="w-7 h-7" size={28} />
            </div>

            {/* 供应商名称 */}
            <h3 className="font-medium text-xl text-text-primary">
              {name}
            </h3>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {/* API Key / 添加模型 按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleApiKeyClick}
              className="h-8 px-3 text-sm gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              {isLocal ? '添加' : 'API-Key'}
            </Button>

            {/* 展开/收起按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleExpand}
              className="h-8 px-3 text-sm gap-1.5"
            >
              <span>{isExpanded ? '隐藏模型' : '展示更多模型'}</span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>

            {/* 删除按钮 */}
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowDeleteDialog(true)
              }}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 展开的内容 */}
        {isExpanded && (
          <div className="border-t border-border">
            {/* 标签 */}
            <div className="px-4 pt-3 flex flex-wrap gap-1.5">
              {sortedTags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 text-xs bg-accent/50 text-text-secondary rounded-md"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* 模型列表 */}
            <div className="m-4 bg-accent/30 rounded-lg max-h-96 overflow-auto">
              {llm.length === 0 ? (
                <div className="py-8 text-center text-text-tertiary text-sm">
                  暂无模型
                </div>
              ) : (
                llm.map((model, index) => (
                  <div
                    key={model.name}
                    className={cn(
                      "flex items-center justify-between p-3 hover:bg-accent/50 transition-colors",
                      index !== llm.length - 1 && "border-b border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-text-primary">
                        {model.name}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-background text-text-secondary rounded-md border border-border">
                        {model.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 本地模型可编辑 */}
                      {isLocal && onEditModel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditModel(model, name)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      {/* 启用/禁用开关 (预留功能) */}
                      {onEnableModel && (
                        <Switch
                          checked={true} // 后续通过 API 获取实际状态
                          onCheckedChange={(checked) => onEnableModel(model.name, name, checked)}
                        />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="flex items-center gap-2 py-2">
                <ProviderIcon provider={name} className="w-6 h-6" size={24} />
                <span className="font-medium text-text-primary">{name}</span>
              </div>
              <p className="mt-2">
                删除后将移除该供应商的所有模型配置，此操作无法撤销。
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
