import { useState, useMemo, type FC } from 'react'
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

import {
  availableModelFilters,
  sortProviderTags,
} from './available-model-filters'

interface AvailableModelsProps {
  handleAddModel: (factoryName: string) => void
}

export const AvailableModels: FC<AvailableModelsProps> = ({
  handleAddModel,
}) => {
  const { t } = useTranslation()
  const { factories } = useFetchFactories()
  const { myLLMs } = useFetchMyLLMs()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const {
    allTags,
    searched,
    filtered: filteredModels,
    counts,
  } = useMemo(
    () =>
      availableModelFilters(
        factories,
        Object.keys(myLLMs),
        searchTerm,
        selectedTags,
      ),
    [factories, myLLMs, searchTerm, selectedTags],
  )

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
      <fieldset
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
          {t('settings.models.allProviders')}{' '}
          <span className="ml-space-xs tabular-nums opacity-70">
            {searched.length}
          </span>
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
            <ModelCapability type={tag} />{' '}
            <span className="ml-space-xs tabular-nums opacity-70">
              {counts.get(tag) ?? 0}
            </span>
          </button>
        ))}
      </fieldset>

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

const AvailableModelCard: FC<AvailableModelCardProps> = ({
  factory,
  onAdd,
}) => {
  const { t } = useTranslation()
  const sortedTags = sortProviderTags(factory.tags)

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
