import React from 'react'
import { useTranslation } from 'react-i18next'
import { Settings as SettingsIcon, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { MetadataCondition } from '@/types/api'
import type {
  MetadataFilterMode,
  MetadataSemiAutoField,
} from '@/components/chat/MetadataFilter'
import type { LLMModel } from '@/types/api'

import type { SearchMode, SearchParams } from '../types'

import { AdvancedParamsSection } from './advanced-params-section'
import { CrossLanguageSection } from './cross-language-section'
import { MetadataSection } from './metadata-section'
import { SearchModeSection } from './search-mode-section'

interface ConfigPanelSheetProps {
  open: boolean
  onClose: () => void
  onApply: () => void
  searchModeLabel: string

  searchMode: SearchMode
  onSearchModeChange: (next: SearchMode) => void

  advancedOpen: boolean
  onToggleAdvanced: () => void

  pageSize: number
  onPageSizeChange: (size: number) => void

  searchParams: SearchParams
  onSearchParamsChange: (next: SearchParams) => void

  rerankModels: LLMModel[]
  rerankLoading: boolean
  rerankError?: string
  onSelectRerank: (id: string | null) => void

  selectedLanguages: string[]
  onSelectedLanguagesChange: (next: string[]) => void

  metadataMode: MetadataFilterMode
  onMetadataModeChange: (mode: MetadataFilterMode) => void
  metadataCondition: MetadataCondition
  onMetadataConditionChange: (cond: MetadataCondition) => void
  metadataSemiAutoFields: MetadataSemiAutoField[]
  onMetadataSemiAutoFieldsChange: (fields: MetadataSemiAutoField[]) => void
  metadataFields: string[]
}

export const ConfigPanelSheet: React.FC<ConfigPanelSheetProps> = (props) => {
  const { t } = useTranslation()
  const { open, onClose, onApply, searchModeLabel } = props

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
            searchMode={props.searchMode}
            onSearchModeChange={props.onSearchModeChange}
          />

          <AdvancedParamsSection
            open={props.advancedOpen}
            onToggle={props.onToggleAdvanced}
            pageSize={props.pageSize}
            onPageSizeChange={props.onPageSizeChange}
            searchParams={props.searchParams}
            onSearchParamsChange={props.onSearchParamsChange}
            rerankModels={props.rerankModels}
            rerankLoading={props.rerankLoading}
            rerankError={props.rerankError}
            onSelectRerank={props.onSelectRerank}
          />

          {props.advancedOpen && (
            <>
              <CrossLanguageSection
                selectedLanguages={props.selectedLanguages}
                onChange={props.onSelectedLanguagesChange}
              />

              <MetadataSection
                metadataMode={props.metadataMode}
                onModeChange={props.onMetadataModeChange}
                metadataCondition={props.metadataCondition}
                onConditionChange={props.onMetadataConditionChange}
                metadataSemiAutoFields={props.metadataSemiAutoFields}
                onSemiAutoFieldsChange={props.onMetadataSemiAutoFieldsChange}
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
            <Button onClick={onApply}>
              {t('knowledge.search.applyConfig')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
