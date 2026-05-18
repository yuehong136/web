import React from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Settings as SettingsIcon } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { SliderWithInput } from '@/components/ui/slider-with-input'
import { RerankModelSelector } from '@/components/knowledge/RerankModelSelector'
import type { LLMModel } from '@/types/api'

import type { SearchParams } from '../types'

interface AdvancedParamsSectionProps {
  open: boolean
  onToggle: () => void
  pageSize: number
  onPageSizeChange: (size: number) => void
  searchParams: SearchParams
  onSearchParamsChange: (next: SearchParams) => void
  rerankModels: LLMModel[]
  rerankLoading: boolean
  rerankError?: string
  onSelectRerank: (id: string | null) => void
}

export const AdvancedParamsSection: React.FC<AdvancedParamsSectionProps> = ({
  open,
  onToggle,
  pageSize,
  onPageSizeChange,
  searchParams,
  onSearchParamsChange,
  rerankModels,
  rerankLoading,
  rerankError,
  onSelectRerank,
}) => {
  const { t } = useTranslation()

  const updateParam = <K extends keyof SearchParams>(
    key: K,
    value: SearchParams[K],
  ) => {
    onSearchParamsChange({ ...searchParams, [key]: value })
  }

  return (
    <section className="pt-space-lg border-t border-border-default">
      <button
        onClick={onToggle}
        className="mb-space-base flex w-full items-center justify-between text-sm font-semibold text-text-primary"
      >
        <span className="gap-space-xs flex items-center">
          <SettingsIcon className="h-4 w-4 text-text-secondary" />
          {t('knowledge.search.config.advanced')}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {open && (
        <div className="space-y-space-lg">
          <div className="gap-space-base grid grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-text-secondary">
                {t('knowledge.search.config.pageSize')}
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={pageSize}
                onChange={(event) => {
                  const nextSize = Math.min(
                    100,
                    Math.max(1, Number(event.target.value) || 1),
                  )
                  onPageSizeChange(nextSize)
                }}
                className="h-8 text-xs"
              />
            </div>

            <SliderWithInput
              label={t('knowledge.search.config.similarityThreshold')}
              tooltip={t('knowledge.search.config.similarityThresholdTooltip')}
              value={searchParams.similarity_threshold}
              onChange={(value) =>
                updateParam('similarity_threshold', Number(value.toFixed(2)))
              }
              min={0}
              max={1}
              step={0.01}
              precision={2}
              showSwitch={false}
            />
          </div>

          <div className="space-y-4">
            <SliderWithInput
              label={t('knowledge.search.config.vectorSimilarityWeight')}
              tooltip={t(
                'knowledge.search.config.vectorSimilarityWeightTooltip',
              )}
              value={searchParams.vector_similarity_weight}
              onChange={(value) =>
                updateParam(
                  'vector_similarity_weight',
                  Number(value.toFixed(2)),
                )
              }
              min={0}
              max={1}
              step={0.01}
              precision={2}
              showSwitch={false}
            />

            <SliderWithInput
              label="Top-K"
              tooltip={t('knowledge.search.config.topKTooltip')}
              value={searchParams.top_k}
              onChange={(value) =>
                updateParam('top_k', Math.max(1, Math.round(value)))
              }
              min={1}
              max={2048}
              step={1}
              showSwitch={false}
              inputOnly
              inputWidth={96}
            />
          </div>

          <div>
            <RerankModelSelector
              models={rerankModels}
              selectedModelId={searchParams.rerank_id}
              onSelect={onSelectRerank}
              loading={rerankLoading}
              error={rerankError}
            />
          </div>

          <div className="gap-space-sm grid grid-cols-1">
            <label className="gap-space-xs flex cursor-pointer items-center">
              <Checkbox
                checked={searchParams.use_kg}
                onCheckedChange={(checked) =>
                  updateParam('use_kg', Boolean(checked))
                }
              />
              <span className="text-xs text-text-secondary">
                {t('knowledge.search.config.useKg')}
              </span>
            </label>

            <label className="gap-space-xs flex cursor-pointer items-center">
              <Checkbox
                checked={searchParams.highlight}
                onCheckedChange={(checked) =>
                  updateParam('highlight', Boolean(checked))
                }
              />
              <span className="text-xs text-text-secondary">
                {t('knowledge.search.config.highlight')}
              </span>
            </label>

            <label className="gap-space-xs flex cursor-pointer items-center">
              <Checkbox
                checked={searchParams.keyword}
                onCheckedChange={(checked) =>
                  updateParam('keyword', Boolean(checked))
                }
              />
              <span className="text-xs text-text-secondary">
                {t('knowledge.search.config.keyword')}
              </span>
            </label>
          </div>
        </div>
      )}
    </section>
  )
}
