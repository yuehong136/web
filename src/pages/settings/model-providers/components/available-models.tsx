import React, { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { type LLMFactoryInterface } from '@/stores/model'
import { useFetchFactories, useFetchMyLLMs } from '@/hooks/use-llm-request'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { cn } from '@/lib/utils'
import {
  ModelCapabilities,
  ModelCapability,
} from '@/components/models/model-capabilities'

// 模型类型标签
type TagType =
  | 'LLM'
  | 'TEXT EMBEDDING'
  | 'TEXT RE-RANK'
  | 'TTS'
  | 'SPEECH2TEXT'
  | 'IMAGE2TEXT'
  | 'MODERATION'

// 标签排序
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

interface AvailableModelsProps {
  handleAddModel: (factoryName: string) => void
}

export const AvailableModels: React.FC<AvailableModelsProps> = ({
  handleAddModel,
}) => {
  const { t } = useTranslation()
  const { factories } = useFetchFactories()
  const { myLLMs } = useFetchMyLLMs()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // 获取已添加的厂商名称列表
  const addedProviderNames = useMemo(() => {
    return Object.keys(myLLMs)
  }, [myLLMs])

  // 获取可用厂商列表（排除已添加的）
  const availableFactories = useMemo(() => {
    return factories.filter(
      (factory) => !addedProviderNames.includes(factory.name),
    )
  }, [factories, addedProviderNames])

  // 过滤模型列表：基于搜索和标签
  const filteredModels = useMemo(() => {
    return availableFactories.filter((factory) => {
      // 搜索匹配
      const matchesSearch = factory.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

      // 标签匹配
      const tags = factory.tags.split(',').map((tag) => tag.trim())
      const matchesTag = selectedTags.every((tag) => tags.includes(tag))

      return matchesSearch && matchesTag
    })
  }, [availableFactories, searchTerm, selectedTags])

  // 获取所有可用标签（只从未添加的厂商中收集）
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>()
    availableFactories.forEach((factory) => {
      factory.tags.split(',').forEach((tag) => {
        const trimmed = tag.trim()
        if (trimmed) tagsSet.add(trimmed)
      })
    })
    return Array.from(tagsSet).sort(
      (a, b) =>
        (TAG_ORDER[a as TagType] || 999) - (TAG_ORDER[b as TagType] || 999),
    )
  }, [availableFactories])

  const handleTagClick = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    )
  }

  return (
    <div className="p-space-base text-text-primary">
      {/* 标题 */}
      <h2 className="mb-space-base text-base font-semibold">
        {t('settings.models.available')}
      </h2>

      <div className="mb-space-base">
        <Input
          type="search"
          aria-label={t('settings.models.searchProviders')}
          placeholder={t('common.search')}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          leftIcon={
            <Search aria-hidden className="size-4 text-text-secondary" />
          }
        />
      </div>

      {/* 标签过滤 - 使用主题感知样式 */}
      <div
        role="group"
        aria-label={t('settings.models.filterCapabilities')}
        className="mb-space-sm flex flex-wrap gap-2"
      >
        {/* All 按钮 */}
        <button
          type="button"
          aria-pressed={selectedTags.length === 0}
          onClick={() => setSelectedTags([])}
          className={cn(
            'min-h-7 rounded-radius-sm px-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-focus',
            selectedTags.length === 0
              ? 'bg-text-primary text-background'
              : 'bg-components-button-secondary-bg text-text-secondary hover:bg-components-button-secondary-bg-hover',
          )}
        >
          {t('settings.models.allProviders')}
        </button>

        {/* 各标签按钮 */}
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            aria-pressed={selectedTags.includes(tag)}
            onClick={() => handleTagClick(tag)}
            className={cn(
              'min-h-7 rounded-radius-sm px-2 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-focus',
              selectedTags.includes(tag)
                ? 'bg-text-primary text-background'
                : 'bg-components-button-secondary-bg text-text-secondary hover:bg-components-button-secondary-bg-hover',
            )}
          >
            <ModelCapability type={tag} />
          </button>
        ))}
      </div>

      <p className="mb-space-base text-xs text-text-secondary">
        {t('settings.models.filterCapabilitiesHint')}
      </p>

      {/* 模型列表 */}
      <div className="flex flex-col gap-space-base">
        {filteredModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
            <Search className="mb-4 h-12 w-12 opacity-30" />
            <p className="text-sm">{t('common.noResults')}</p>
          </div>
        ) : (
          filteredModels.map((factory) => (
            <AvailableModelCard
              key={factory.id}
              factory={factory}
              onAdd={() => handleAddModel(factory.name)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// 可用模型卡片组件
interface AvailableModelCardProps {
  factory: LLMFactoryInterface
  onAdd: () => void
}

const AvailableModelCard: React.FC<AvailableModelCardProps> = ({
  factory,
  onAdd,
}) => {
  const { t } = useTranslation()
  const sortedTags = sortTags(factory.tags)

  return (
    <div className="rounded-radius-lg border border-border-default p-space-base">
      {/* 头部：图标 + 名称 + 添加按钮 */}
      <div className="mb-3 flex items-center gap-3">
        {/* 图标 - 使用 ProviderIcon 组件 */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
          <ProviderIcon provider={factory.name} className="h-6 w-6" size={24} />
        </div>

        {/* 名称 */}
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-normal text-text-primary">
            {factory.name}
          </h4>
        </div>

        {/* 添加按钮 - hover 时显示 */}
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
          className="shrink-0"
        >
          <Plus className="h-3 w-3" />
          {t('common.add')}
        </Button>
      </div>

      {/* 标签列表 */}
      <ModelCapabilities types={sortedTags} />
    </div>
  )
}
