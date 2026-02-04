import React, { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { SelectWithSearch, type SelectOptionGroup } from '@/components/ui/select-with-search'
import { ProviderIcon } from '@/components/ui/provider-icon'
import type { ModelInfo } from '@/types/mcp'

export interface ModelSelectorProps {
  selectedModelId: string
  onModelChange: (modelId: string) => void
  temporaryChatEnabled: boolean
  onTemporaryChatChange: (enabled: boolean) => void
  className?: string
}

// 模拟模型数据
const MOCK_MODELS: ModelInfo[] = [
  {
    id: 'qwen3-235b-a22b-2507',
    name: 'Qwen-3 235B',
    provider: 'Tongyi-Qianwen',
    description: '最新的通义千问大模型',
    maxTokens: 8192
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'OpenAI最新多模态模型',
    maxTokens: 128000
  },
  {
    id: 'claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Anthropic高性能模型',
    maxTokens: 200000
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'Gemini',
    description: 'Google先进AI模型',
    maxTokens: 32768
  }
]

// 模型选项 Label
const ModelOptionLabel: React.FC<{ model: ModelInfo }> = ({ model }) => (
  <div className="flex items-center gap-2 min-w-0 w-full">
    <ProviderIcon provider={model.provider} className="w-4 h-4 shrink-0" size={16} />
    <div className="flex-1 min-w-0">
      <div className="font-medium truncate">{model.name}</div>
      <div className="text-xs text-text-tertiary truncate">{model.description}</div>
    </div>
    <Badge variant="outline" className="text-xs shrink-0">
      {(model.maxTokens || 0).toLocaleString()}
    </Badge>
  </div>
)

export function ModelSelector({
  selectedModelId,
  onModelChange,
  temporaryChatEnabled,
  onTemporaryChatChange,
  className = ''
}: ModelSelectorProps) {
  // 按厂商分组
  const groupedOptions = useMemo((): SelectOptionGroup[] => {
    const groups: Record<string, ModelInfo[]> = {}
    
    MOCK_MODELS.forEach(model => {
      if (!groups[model.provider]) {
        groups[model.provider] = []
      }
      groups[model.provider].push(model)
    })

    return Object.entries(groups).map(([provider, models]) => ({
      label: provider,
      options: models.map(model => ({
        label: <ModelOptionLabel model={model} />,
        value: model.id
      }))
    }))
  }, [])

  const _selectedModel = MOCK_MODELS.find(model => model.id === selectedModelId)

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* 模型选择器 */}
      <div className="min-w-[200px]">
        <SelectWithSearch
          value={selectedModelId}
          options={groupedOptions}
          onChange={onModelChange}
          placeholder="选择模型"
          emptyText="未找到匹配的模型"
          triggerClassName="h-10"
        />
      </div>

      {/* 临时聊天开关 */}
      <div className="flex items-center gap-2">
        <Switch
          id="temporary-chat"
          checked={temporaryChatEnabled}
          onCheckedChange={onTemporaryChatChange}
        />
        <Label htmlFor="temporary-chat" className="text-sm text-text-secondary">
          临时模式
        </Label>
      </div>

      {/* 状态显示 */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-success/10 text-success">
          在线
        </Badge>
        {temporaryChatEnabled && (
          <Badge variant="outline" className="bg-warning/10 text-warning">
            临时模式
          </Badge>
        )}
      </div>
    </div>
  )
}
