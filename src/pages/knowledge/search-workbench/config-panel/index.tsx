import React from 'react'
import { useTranslation } from 'react-i18next'
import { Settings as SettingsIcon, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { LLMModel, MetadataCondition } from '@/types/api'
import type {
  MetadataFilterMode,
  MetadataSemiAutoField,
} from '@/components/chat/MetadataFilter'

import type { SearchConfigState } from '../types'

import { AdvancedParamsSection } from './advanced-params-section'
import { CrossLanguageSection } from './cross-language-section'
import { MetadataSection } from './metadata-section'
import { SearchModeSection, useSearchModeOptions } from './search-mode-section'

interface ConfigPanelSheetProps {
  open: boolean
  onClose: () => void
  onApply: (config: SearchConfigState) => void
  initialConfig: SearchConfigState

  advancedOpen: boolean
  onToggleAdvanced: () => void

  rerankModels: LLMModel[]
  rerankLoading: boolean
  rerankError?: string
  metadataFields: string[]
}

const cloneConfig = (config: SearchConfigState): SearchConfigState => ({
  searchParams: { ...config.searchParams },
  searchMode: { ...config.searchMode },
  pageSize: config.pageSize,
  selectedLanguages: [...config.selectedLanguages],
  metadataMode: config.metadataMode,
  metadataCondition: {
    ...config.metadataCondition,
    conditions: (config.metadataCondition.conditions || []).map(
      (condition) => ({ ...condition }),
    ),
  },
  metadataSemiAutoFields: config.metadataSemiAutoFields.map((field) => ({
    ...field,
  })),
  activeMetaDataFilter: config.activeMetaDataFilter,
})

export const ConfigPanelSheet: React.FC<ConfigPanelSheetProps> = (props) => {
  const { t } = useTranslation()
  const options = useSearchModeOptions()
  const { open, onClose, onApply } = props
  const [draft, setDraft] = React.useState<SearchConfigState>(() =>
    cloneConfig(props.initialConfig),
  )
  const wasOpenRef = React.useRef(false)

  React.useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraft(cloneConfig(props.initialConfig))
    }
    wasOpenRef.current = open
  }, [open, props.initialConfig])

  const updateDraft = React.useCallback(
    (updater: (current: SearchConfigState) => SearchConfigState) => {
      setDraft((current) => updater(current))
    },
    [],
  )

  const searchModeLabel =
    options.find((option) => option.value === draft.searchMode.type)?.label ||
    t('knowledge.search.config.fallbackMode')

  if (!open) return null

  return (
    <div
      className="absolute inset-y-0 right-0 z-40 flex justify-end"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="flex h-full w-[440px] max-w-[calc(100vw-2rem)] flex-col border-l border-border-default bg-background-surface">
        <div className="px-space-lg py-space-base border-b border-border-default">
          <div className="gap-space-base flex items-start justify-between">
            <div className="gap-space-sm flex items-start">
              <SettingsIcon className="mt-0.5 h-4 w-4 text-text-secondary" />
              <div>
                <h3 className="text-base font-semibold text-text-primary">
                  {t('knowledge.search.configTitle')}
                </h3>
                <p className="mt-space-xs text-xs text-text-tertiary">
                  {t('knowledge.search.currentMode', {
                    mode: searchModeLabel,
                  })}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="shrink-0 text-text-tertiary hover:text-text-secondary"
              aria-label={t('knowledge.common.cancel')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-space-xl px-space-lg py-space-lg min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          <SearchModeSection
            searchMode={draft.searchMode}
            onSearchModeChange={(searchMode) =>
              updateDraft((current) => ({ ...current, searchMode }))
            }
          />

          <AdvancedParamsSection
            open={props.advancedOpen}
            onToggle={props.onToggleAdvanced}
            pageSize={draft.pageSize}
            onPageSizeChange={(pageSize) =>
              updateDraft((current) => ({ ...current, pageSize }))
            }
            searchParams={draft.searchParams}
            onSearchParamsChange={(searchParams) =>
              updateDraft((current) => ({ ...current, searchParams }))
            }
            rerankModels={props.rerankModels}
            rerankLoading={props.rerankLoading}
            rerankError={props.rerankError}
            onSelectRerank={(modelId) =>
              updateDraft((current) => ({
                ...current,
                searchParams: { ...current.searchParams, rerank_id: modelId },
              }))
            }
          />

          {props.advancedOpen && (
            <>
              <CrossLanguageSection
                selectedLanguages={draft.selectedLanguages}
                onChange={(selectedLanguages) =>
                  updateDraft((current) => ({
                    ...current,
                    selectedLanguages,
                  }))
                }
              />

              <MetadataSection
                metadataMode={draft.metadataMode}
                onModeChange={(metadataMode: MetadataFilterMode) =>
                  updateDraft((current) => ({ ...current, metadataMode }))
                }
                metadataCondition={draft.metadataCondition as MetadataCondition}
                onConditionChange={(metadataCondition: MetadataCondition) =>
                  updateDraft((current) => ({ ...current, metadataCondition }))
                }
                metadataSemiAutoFields={
                  draft.metadataSemiAutoFields as MetadataSemiAutoField[]
                }
                onSemiAutoFieldsChange={(
                  metadataSemiAutoFields: MetadataSemiAutoField[],
                ) =>
                  updateDraft((current) => ({
                    ...current,
                    metadataSemiAutoFields,
                  }))
                }
                metadataFields={props.metadataFields}
              />
            </>
          )}
        </div>

        <div className="px-space-lg py-space-base border-t border-border-default bg-background-surface">
          <div className="gap-space-sm flex justify-end">
            <Button variant="outline" onClick={onClose}>
              {t('knowledge.common.cancel')}
            </Button>
            <Button onClick={() => onApply(cloneConfig(draft))}>
              {t('knowledge.search.applyConfig')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
