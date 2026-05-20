import type { Dispatch, FC, ReactNode, SetStateAction } from 'react'
import {
  Brain,
  CheckCircle,
  Clock,
  Filter,
  Globe,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomSelect } from '@/components/ui/custom-select'
import { SectionCard } from '@/components/patterns/section-card'
import { cn } from '@/lib/utils'
import type { KnowledgeFilterOption, KnowledgeFilterState } from './types'

interface KnowledgeFilterPanelProps {
  clearAllFilters: () => void
  embeddingOptions: KnowledgeFilterOption[]
  filters: KnowledgeFilterState
  hasActiveFilters: boolean
  languageOptions: KnowledgeFilterOption[]
  parserOptions: KnowledgeFilterOption[]
  permissionOptions: KnowledgeFilterOption[]
  searchQuery: string
  setFilters: Dispatch<SetStateAction<KnowledgeFilterState>>
  timeRangeOptions: KnowledgeFilterOption[]
}

interface FilterGroupProps {
  icon: ReactNode
  options: KnowledgeFilterOption[]
  tone: 'info' | 'success' | 'warning'
  title: ReactNode
  value: string[]
  onChange: (value: string[]) => void
  scroll?: boolean
}

const toneClassNames = {
  info: 'bg-status-info-subtle text-status-info',
  success: 'bg-status-success-subtle text-status-success',
  warning: 'bg-status-warning-subtle text-status-warning',
}

const FilterGroup: FC<FilterGroupProps> = ({
  icon,
  onChange,
  options,
  scroll = false,
  title,
  tone,
  value,
}) => {
  const toggleValue = (optionValue: string, checked: boolean) => {
    onChange(
      checked
        ? [...value, optionValue]
        : value.filter((currentValue) => currentValue !== optionValue),
    )
  }

  return (
    <div className="rounded-radius-lg p-space-sm border border-border-default bg-background-surface">
      <div className="mb-space-sm gap-space-xs flex items-center text-sm font-medium text-text-primary">
        <div className={cn('rounded-radius-md p-1', toneClassNames[tone])}>
          {icon}
        </div>
        <span>{title}</span>
      </div>
      <div
        className={cn(
          'space-y-2',
          scroll && 'max-h-40 overflow-y-auto scrollbar-thin',
        )}
      >
        {options.map((option) => (
          <button
            type="button"
            className="gap-space-xs rounded-radius-md flex cursor-pointer items-center px-1 py-1 text-sm text-text-secondary transition-colors hover:bg-state-hover"
            key={option.value}
            onClick={() =>
              toggleValue(option.value, !value.includes(option.value))
            }
          >
            <Checkbox
              checked={value.includes(option.value)}
              className="shrink-0"
              onCheckedChange={(checked) =>
                toggleValue(option.value, Boolean(checked))
              }
              onClick={(event) => event.stopPropagation()}
            />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export const KnowledgeFilterPanel: FC<KnowledgeFilterPanelProps> = ({
  clearAllFilters,
  embeddingOptions,
  filters,
  hasActiveFilters,
  languageOptions,
  parserOptions,
  permissionOptions,
  searchQuery,
  setFilters,
  timeRangeOptions,
}) => {
  const { t } = useTranslation()
  const selectedTimeRange = timeRangeOptions.find(
    (option) => option.value === filters.time_range,
  )

  return (
    <SectionCard
      className="bg-background-subtle"
      padding="default"
      title={
        <div className="gap-space-xs flex items-center">
          <span className="rounded-radius-md bg-status-info-subtle p-1.5 text-status-info">
            <Filter className="h-4 w-4" />
          </span>
          {t('knowledge.list.filters.title')}
        </div>
      }
      actions={
        <div className="gap-space-sm flex items-center">
          {hasActiveFilters ? (
            <Button
              className="text-text-tertiary hover:text-text-secondary"
              onClick={clearAllFilters}
              size="sm"
              variant="ghost"
            >
              <X className="h-3 w-3" />
              {t('knowledge.list.filters.clear')}
            </Button>
          ) : null}
          <span className="text-xs text-text-tertiary">
            {t('knowledge.list.filters.autoApply')}
          </span>
        </div>
      }
    >
      <div className="gap-space-base grid grid-cols-1 md:grid-cols-5">
        <FilterGroup
          icon={<Users className="h-3 w-3" />}
          onChange={(permissions) =>
            setFilters((prev) => ({ ...prev, permissions }))
          }
          options={permissionOptions}
          title={t('knowledge.list.filters.permission.title')}
          tone="success"
          value={filters.permissions}
        />
        <FilterGroup
          icon={<Globe className="h-3 w-3" />}
          onChange={(languages) =>
            setFilters((prev) => ({ ...prev, languages }))
          }
          options={languageOptions}
          title={t('knowledge.list.filters.language')}
          tone="info"
          value={filters.languages}
        />
        <FilterGroup
          icon={<Zap className="h-3 w-3" />}
          onChange={(parserIds) =>
            setFilters((prev) => ({ ...prev, parser_ids: parserIds }))
          }
          options={parserOptions}
          scroll
          title={t('knowledge.list.filters.parser')}
          tone="warning"
          value={filters.parser_ids}
        />
        <FilterGroup
          icon={<Brain className="h-3 w-3" />}
          onChange={(embeddingIds) =>
            setFilters((prev) => ({ ...prev, embd_ids: embeddingIds }))
          }
          options={embeddingOptions}
          scroll
          title={t('knowledge.list.filters.embedding')}
          tone="info"
          value={filters.embd_ids}
        />

        <div className="rounded-radius-lg p-space-sm border border-border-default bg-background-surface">
          <div className="mb-space-sm gap-space-xs flex items-center text-sm font-medium text-text-primary">
            <span className="rounded-radius-md bg-status-warning-subtle p-1 text-status-warning">
              <Clock className="h-3 w-3" />
            </span>
            {t('knowledge.list.filters.time.title')}
          </div>
          <CustomSelect
            onChange={(timeRange) =>
              setFilters((prev) => ({ ...prev, time_range: timeRange }))
            }
            options={timeRangeOptions}
            value={filters.time_range}
          />
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="mt-space-base rounded-radius-lg p-space-sm border-t border-border-default bg-background-surface">
          <div className="mb-space-sm gap-space-xs flex items-center">
            <span className="rounded-radius-md bg-status-info-subtle p-1 text-status-info">
              <CheckCircle className="h-3 w-3" />
            </span>
            <div className="text-sm font-medium text-text-secondary">
              {t('knowledge.list.filters.activeTitle')}
            </div>
          </div>
          <div className="gap-space-xs flex flex-wrap">
            {searchQuery.trim() ? (
              <span className="rounded-radius-full px-space-sm bg-status-info-subtle py-0.5 text-xs font-medium text-status-info">
                {t('knowledge.list.filters.activeKeyword', {
                  keyword: searchQuery,
                })}
              </span>
            ) : null}
            {filters.permissions.map((permission) => (
              <span
                className="rounded-radius-full px-space-sm bg-status-success-subtle py-0.5 text-xs font-medium text-status-success"
                key={permission}
              >
                {t('knowledge.list.filters.activePermission', {
                  value: permission,
                })}
              </span>
            ))}
            {filters.languages.map((language) => (
              <span
                className="rounded-radius-full px-space-sm bg-status-info-subtle py-0.5 text-xs font-medium text-status-info"
                key={language}
              >
                {t('knowledge.list.filters.activeLanguage', {
                  value: language,
                })}
              </span>
            ))}
            {filters.parser_ids.map((parser) => (
              <span
                className="rounded-radius-full px-space-sm bg-status-warning-subtle py-0.5 text-xs font-medium text-status-warning"
                key={parser}
              >
                {t('knowledge.list.filters.activeParser', { value: parser })}
              </span>
            ))}
            {filters.embd_ids.map((embedding) => (
              <span
                className="rounded-radius-full px-space-sm bg-status-error-subtle py-0.5 text-xs font-medium text-status-error"
                key={embedding}
              >
                {t('knowledge.list.filters.activeEmbedding', {
                  value: embedding,
                })}
              </span>
            ))}
            {filters.time_range !== 'all' && selectedTimeRange ? (
              <span className="rounded-radius-full px-space-sm bg-status-warning-subtle py-0.5 text-xs font-medium text-status-warning">
                {t('knowledge.list.filters.activeTime', {
                  value: selectedTimeRange.label,
                })}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </SectionCard>
  )
}
