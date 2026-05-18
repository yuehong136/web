import React from 'react'
import { useTranslation } from 'react-i18next'
import { BookOpen, Layers, Search, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'

import {
  DISABLED_SEARCH_MODES,
  FUSION_DEFAULT_WEIGHTS,
  HYBRID_DEFAULT_WEIGHT_DENSE,
  HYBRID_DEFAULT_WEIGHT_SPARSE,
  SEARCH_MODE_VALUES,
  type SearchModeValue,
} from '../constants'
import type { SearchMode } from '../types'

import { ReadonlyWeightBar } from './readonly-weight-bar'

interface SearchModeSectionProps {
  searchMode: SearchMode
  onSearchModeChange: (next: SearchMode) => void
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

const round2 = (value: number): number => Number(value.toFixed(2))

interface SearchModeOption {
  value: SearchModeValue
  labelKey: string
  descriptionKey: string
  icon: React.ReactNode
}

const SEARCH_MODE_OPTIONS: SearchModeOption[] = [
  {
    value: 'fusion',
    labelKey: 'knowledge.search.modes.fusion.label',
    descriptionKey: 'knowledge.search.modes.fusion.description',
    icon: <Layers className="h-4 w-4" />,
  },
  {
    value: 'sparse',
    labelKey: 'knowledge.search.modes.sparse.label',
    descriptionKey: 'knowledge.search.modes.sparse.description',
    icon: <Search className="h-4 w-4" />,
  },
  {
    value: 'hybrid',
    labelKey: 'knowledge.search.modes.hybrid.label',
    descriptionKey: 'knowledge.search.modes.hybrid.description',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    value: 'dense',
    labelKey: 'knowledge.search.modes.dense.label',
    descriptionKey: 'knowledge.search.modes.dense.description',
    icon: <BookOpen className="h-4 w-4" />,
  },
]

export const useSearchModeOptions = () => {
  const { t } = useTranslation()
  return React.useMemo(
    () =>
      SEARCH_MODE_OPTIONS.map((option) => ({
        ...option,
        label: t(option.labelKey),
        description: t(option.descriptionKey),
      })),
    [t],
  )
}

export const SearchModeSection: React.FC<SearchModeSectionProps> = ({
  searchMode,
  onSearchModeChange,
}) => {
  const { t } = useTranslation()
  const options = useSearchModeOptions()

  const handleModeChange = (value: string) => {
    const next = SEARCH_MODE_VALUES.find((mode) => mode === value)
    if (!next) return
    if (next === 'fusion') {
      onSearchModeChange({ type: 'fusion', weights: FUSION_DEFAULT_WEIGHTS })
      return
    }
    if (next === 'hybrid') {
      onSearchModeChange({
        type: 'hybrid',
        weight_dense: HYBRID_DEFAULT_WEIGHT_DENSE,
        weight_sparse: HYBRID_DEFAULT_WEIGHT_SPARSE,
      })
      return
    }
    onSearchModeChange({ type: next })
  }

  const handleHybridDenseChange = (denseRaw: number) => {
    const denseWeight = round2(clamp(denseRaw, 0, 1))
    const sparseWeight = round2(1 - denseWeight)
    onSearchModeChange({
      type: 'hybrid',
      weight_dense: denseWeight,
      weight_sparse: sparseWeight,
    })
  }

  const handleFusionTextChange = (textRaw: number) => {
    const textWeight = round2(clamp(textRaw, 0, 1))
    const vectorWeight = round2(1 - textWeight)
    onSearchModeChange({
      type: 'fusion',
      weights: `${textWeight},${vectorWeight}`,
    })
  }

  const fusionWeights = (searchMode.weights || FUSION_DEFAULT_WEIGHTS)
    .split(',')
    .map((value) => Number.parseFloat(value))
  const fusionTextWeight = Number.isFinite(fusionWeights[0])
    ? fusionWeights[0]
    : 0.05
  const fusionVectorWeight = Number.isFinite(fusionWeights[1])
    ? fusionWeights[1]
    : 0.95

  const hybridDense =
    typeof searchMode.weight_dense === 'number'
      ? searchMode.weight_dense
      : HYBRID_DEFAULT_WEIGHT_DENSE
  const hybridSparse =
    typeof searchMode.weight_sparse === 'number'
      ? searchMode.weight_sparse
      : HYBRID_DEFAULT_WEIGHT_SPARSE

  return (
    <section className="space-y-space-sm">
      <div>
        <h4 className="text-sm font-semibold text-text-primary">
          {t('knowledge.search.config.mode')}
        </h4>
        <p className="mt-space-xs text-xs text-text-tertiary">
          {t('knowledge.search.config.modeDescription')}
        </p>
      </div>
      <RadioGroup
        value={searchMode.type}
        onValueChange={handleModeChange}
        className="space-y-2"
      >
        {options.map((option) => {
          const disabled = DISABLED_SEARCH_MODES.has(option.value)
          const selected = searchMode.type === option.value
          return (
            <div key={option.value}>
              <label
                className={`gap-space-sm rounded-radius-md px-space-sm py-space-sm flex items-start border transition-colors ${
                  selected
                    ? 'border-components-input-border-focus bg-components-input-bg-focus'
                    : 'border-transparent hover:bg-background-default'
                } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
              >
                <RadioGroupItem
                  value={option.value}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="gap-space-xs flex items-center">
                    {option.icon}
                    <span className="text-sm font-medium text-text-primary">
                      {option.label}
                    </span>
                    {disabled && (
                      <Badge variant="secondary" className="text-xs">
                        {t('knowledge.search.config.unavailable')}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {option.description}
                  </p>
                </div>
              </label>

              {searchMode.type === 'hybrid' && option.value === 'hybrid' && (
                <div className="ml-space-lg mt-space-sm space-y-space-md pl-space-base border-l border-border-default">
                  <div>
                    <label className="mb-2 block text-xs text-text-secondary">
                      {t('knowledge.search.config.vectorWeight')}
                    </label>
                    <div className="flex items-center space-x-3">
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[hybridDense]}
                        onValueChange={(value) =>
                          handleHybridDenseChange(Number(value[0]))
                        }
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={hybridDense}
                        onChange={(event) =>
                          handleHybridDenseChange(Number(event.target.value))
                        }
                        className="h-7 w-16 text-center text-xs"
                      />
                    </div>
                  </div>
                  <ReadonlyWeightBar
                    label={t('knowledge.search.config.sparseWeight')}
                    value={hybridSparse}
                    hint={t('knowledge.search.config.hybridWeightHint')}
                  />
                </div>
              )}

              {searchMode.type === 'fusion' && option.value === 'fusion' && (
                <div className="ml-space-lg mt-space-sm space-y-space-md pl-space-base border-l border-border-default">
                  <div>
                    <label className="mb-2 block text-xs text-text-secondary">
                      {t('knowledge.search.config.fusionTextWeight')}
                    </label>
                    <div className="flex items-center space-x-3">
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={[fusionTextWeight]}
                        onValueChange={(value) =>
                          handleFusionTextChange(Number(value[0]))
                        }
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.01"
                        value={fusionTextWeight}
                        onChange={(event) =>
                          handleFusionTextChange(Number(event.target.value))
                        }
                        className="h-7 w-16 text-center text-xs"
                      />
                    </div>
                  </div>
                  <ReadonlyWeightBar
                    label={t('knowledge.search.config.fusionVectorWeight')}
                    value={fusionVectorWeight}
                    hint={t('knowledge.search.config.fusionWeightHint')}
                  />
                </div>
              )}
            </div>
          )
        })}
      </RadioGroup>
    </section>
  )
}
