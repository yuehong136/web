import React, { useState, useMemo } from 'react'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type LLMFactoryInterface } from '@/stores/model'
import { useFetchFactories, useFetchMyLLMs } from '@/hooks/use-llm-request'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { cn } from '@/lib/utils'

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
  const { factories } = useFetchFactories()
  const { myLLMs } = useFetchMyLLMs()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

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
      const matchesTag =
        selectedTag === null ||
        factory.tags.split(',').some((tag) => tag.trim() === selectedTag)

      return matchesSearch && matchesTag
    })
  }, [availableFactories, searchTerm, selectedTag])

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
    setSelectedTag(selectedTag === tag ? null : tag)
  }

  return (
    <div className="h-full p-4 text-text-primary">
      {/* 标题 */}
      <h2 className="mb-4 text-base font-medium">可选模型</h2>

      {/* 搜索框 - 使用主题感知样式 */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="搜索"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={cn(
              'h-9 w-full rounded-lg pl-10 pr-4 text-sm',
              'bg-[var(--color-bg-input,var(--color-background-secondary))]',
              'border border-[var(--color-border-button,var(--color-border))]',
              'text-text-primary placeholder:text-text-tertiary',
              'focus:outline-none focus:ring-1 focus:ring-primary',
              'transition-colors',
            )}
          />
        </div>
      </div>

      {/* 标签过滤 - 使用主题感知样式 */}
      <div className="mb-5 flex flex-wrap gap-2">
        {/* All 按钮 */}
        <button
          onClick={() => setSelectedTag(null)}
          className={cn(
            'h-6 rounded-sm px-2 text-xs transition-colors',
            selectedTag === null
              ? 'bg-text-primary text-background'
              : 'hover:bg-accent/80 bg-[var(--color-bg-card,var(--color-background-secondary))] text-text-secondary',
          )}
        >
          All
        </button>

        {/* 各标签按钮 */}
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => handleTagClick(tag)}
            className={cn(
              'h-6 rounded-sm px-2 text-xs transition-colors',
              selectedTag === tag
                ? 'bg-text-primary text-background'
                : 'hover:bg-accent/80 bg-[var(--color-bg-card,var(--color-background-secondary))] text-text-secondary',
            )}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 模型列表 */}
      <div className="flex h-[calc(100vh-300px)] flex-col gap-4 overflow-auto">
        {filteredModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
            <Search className="mb-4 h-12 w-12 opacity-30" />
            <p className="text-sm">未找到匹配的模型供应商</p>
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
  const sortedTags = sortTags(factory.tags)

  return (
    <div
      className="group cursor-pointer rounded-lg border border-border p-3 transition-colors hover:bg-[var(--color-bg-input,var(--color-accent))]"
      onClick={onAdd}
    >
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
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
          className="h-6 gap-0.5 rounded-md px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Plus className="h-3 w-3" />
          添加模型
        </Button>
      </div>

      {/* 标签列表 */}
      <div className="flex flex-wrap gap-1.5">
        {sortedTags.map((tag, index) => (
          <span
            key={index}
            className="flex h-5 items-center rounded-md bg-accent px-1.5 py-0.5 text-xs text-text-secondary"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
