import * as React from 'react'
import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
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
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { cn } from '@/lib/utils'
import type { MyLLMModel } from '@/stores/model'

// 模型类型标签排序
type TagType =
  | 'LLM'
  | 'TEXT EMBEDDING'
  | 'TEXT RE-RANK'
  | 'TTS'
  | 'SPEECH2TEXT'
  | 'IMAGE2TEXT'
  | 'MODERATION'

const TAG_ORDER: Record<TagType, number> = {
  LLM: 1,
  'TEXT EMBEDDING': 2,
  'TEXT RE-RANK': 3,
  TTS: 4,
  SPEECH2TEXT: 5,
  IMAGE2TEXT: 6,
  MODERATION: 7,
}

const sortTags = (tags: string): string[] => {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .sort(
      (a, b) =>
        (TAG_ORDER[a as TagType] || 999) - (TAG_ORDER[b as TagType] || 999),
    )
}

// 判断是否是本地模型厂商
const isLocalFactory = (name: string): boolean => {
  const localFactories = [
    'Ollama',
    'Xinference',
    'LocalAI',
    'LM-Studio',
    'GPUStack',
    'VLLM',
    'ModelScope',
  ]
  return localFactories.includes(name)
}

interface ModelProviderCardProps {
  name: string
  tags: string
  llm: MyLLMModel[]
  onApiKeyClick: (name: string) => void
  onDeleteClick: (name: string) => void
  onEditModel?: (model: MyLLMModel, providerName: string) => void
  onEnableModel?: (
    modelName: string,
    providerName: string,
    enabled: boolean,
  ) => void
}

export const ModelProviderCard: React.FC<ModelProviderCardProps> = ({
  name,
  tags,
  llm,
  onApiKeyClick,
  onDeleteClick,
  onEditModel,
  onEnableModel,
}) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleToggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const handleApiKeyClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onApiKeyClick(name)
    },
    [name, onApiKeyClick],
  )

  const handleDeleteConfirm = useCallback(() => {
    onDeleteClick(name)
    setShowDeleteDialog(false)
  }, [name, onDeleteClick])

  const sortedTags = sortTags(tags)
  const isLocal = isLocalFactory(name)

  return (
    <>
      <div className="w-full rounded-lg border border-border bg-background">
        <div className="flex flex-wrap items-center gap-space-sm p-space-base">
          <h3 className="min-w-0 flex-1 basis-36">
            <button
              type="button"
              onClick={handleToggleExpand}
              aria-expanded={isExpanded}
              className="flex w-full min-w-0 items-center gap-space-sm rounded-radius-md text-left text-base font-medium text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden"
            >
              <ProviderIcon
                provider={name}
                className="size-icon-xl shrink-0"
                size={28}
              />
              <span className="min-w-0 flex-1 truncate" title={name}>
                {name}
              </span>
              {isExpanded ? (
                <ChevronUp className="size-icon-sm shrink-0 text-text-secondary" />
              ) : (
                <ChevronDown className="size-icon-sm shrink-0 text-text-secondary" />
              )}
            </button>
          </h3>
          <div className="flex shrink-0 items-center gap-space-xs">
            <Button variant="outline" size="sm" onClick={handleApiKeyClick}>
              <Settings className="size-icon-sm" />
              {isLocal ? t('common.add') : 'API-Key'}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`${t('common.delete')}: ${name}`}
              onClick={() => setShowDeleteDialog(true)}
              className="text-text-secondary hover:text-status-error"
            >
              <Trash2 className="size-icon-sm" />
            </Button>
          </div>
        </div>

        {/* 展开的内容 */}
        {isExpanded && (
          <div className="border-t border-border">
            {/* 标签 */}
            <div className="flex flex-wrap gap-1.5 px-4 pt-3">
              {sortedTags.map((tag, index) => (
                <span
                  key={index}
                  className="rounded-md bg-accent/50 px-2 py-1 text-xs text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* 模型列表 */}
            <div className="m-4 max-h-96 overflow-auto rounded-lg bg-accent/30">
              {llm.length === 0 ? (
                <div className="py-8 text-center text-sm text-text-tertiary">
                  暂无模型
                </div>
              ) : (
                llm.map((model, index) => (
                  <div
                    key={model.name}
                    className={cn(
                      'flex items-center justify-between p-3 transition-colors hover:bg-accent/50',
                      index !== llm.length - 1 && 'border-b border-border',
                    )}
                  >
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-space-sm">
                      <span className="min-w-0 truncate font-medium text-text-primary">
                        {model.name}
                      </span>
                      <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-text-secondary">
                        {model.type}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-space-xs">
                      {/* 本地模型可编辑 */}
                      {isLocal && onEditModel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditModel(model, name)}
                          className="h-7 w-7 p-0"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      {/* 启用/禁用开关 (预留功能) */}
                      {onEnableModel && (
                        <Switch
                          checked={model.status ? model.status === '1' : true}
                          onCheckedChange={(checked) =>
                            onEnableModel(model.name, name, checked)
                          }
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
                <ProviderIcon provider={name} className="h-6 w-6" size={24} />
                <span className="min-w-0 truncate font-medium text-text-primary">
                  {name}
                </span>
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
