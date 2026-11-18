import React from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'

import { CROSS_LANGUAGE_OPTIONS } from '../constants'

interface CrossLanguageSectionProps {
  selectedLanguages: string[]
  onChange: (next: string[]) => void
}

export const CrossLanguageSection: React.FC<CrossLanguageSectionProps> = ({
  selectedLanguages,
  onChange,
}) => {
  const { t } = useTranslation()

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-fg-muted">
        {t('knowledge.search.config.crossLanguage')}
        {selectedLanguages.length > 0 && (
          <Badge variant="secondary" className="ml-2 text-xs">
            {t('knowledge.search.config.languageCount', {
              count: selectedLanguages.length,
            })}
          </Badge>
        )}
      </label>
      <MultiSelectWithSearch
        options={CROSS_LANGUAGE_OPTIONS}
        value={selectedLanguages}
        onChange={onChange}
        placeholder={t('knowledge.search.config.languagePlaceholder')}
        emptyText={t('knowledge.search.config.languageEmpty')}
        allowClear
        maxDisplayItems={100}
        triggerClassName="min-h-10 bg-surface hover:bg-surface focus-visible:border-line-focus focus-visible:bg-surface focus-visible:ring-accent-soft"
      />

      <div className="mt-1 text-xs text-fg-subtle">
        {t('knowledge.search.config.languageHelp')}
      </div>
    </div>
  )
}
