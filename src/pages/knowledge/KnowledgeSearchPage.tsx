import React from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { SplitDetailPageTemplate } from '@/components/page-templates'
import { useKnowledgeStore } from '@/stores/knowledge'

import {
  ConfigPanelSheet,
  ResultPanel,
  ResultPreviewModal,
  SearchPanel,
  useConfigPanelUi,
  useFetchRerankLLMs,
  useResultPreview,
  useSearchExecution,
  useSearchModeOptions,
  useSearchParamsState,
} from './search-workbench'

const KnowledgeSearchPage: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { currentKnowledgeBase } = useKnowledgeStore()

  const params = useSearchParamsState()
  const execution = useSearchExecution({
    kbId: id,
    searchParams: params.searchParams,
    searchMode: params.searchMode,
    selectedLanguages: params.selectedLanguages,
    activeMetaDataFilter: params.activeMetaDataFilter,
  })
  const preview = useResultPreview()
  const configPanel = useConfigPanelUi()
  const rerankQuery = useFetchRerankLLMs()
  const searchModeOptions = useSearchModeOptions()

  const metadataFields = React.useMemo(() => {
    return (currentKnowledgeBase?.metadata_settings || [])
      .map((field) => field.key)
      .filter((key): key is string => Boolean(key))
  }, [currentKnowledgeBase?.metadata_settings])

  const searchModeLabel =
    searchModeOptions.find((option) => option.value === params.searchMode.type)
      ?.label || t('knowledge.search.config.fallbackMode')

  const handleRerankSelect = React.useCallback(
    (modelId: string | null) => {
      params.setSearchParams((prev) => ({ ...prev, rerank_id: modelId }))
    },
    [params],
  )

  const rerankErrorText = rerankQuery.error
    ? t('knowledge.search.rerank.loadError')
    : undefined

  const handleApplyConfig = React.useCallback(() => {
    configPanel.closePanel()
    if (execution.hasSearched && execution.query.trim()) {
      void execution.runSearch({ page: 1 })
    }
  }, [configPanel, execution])

  return (
    <SplitDetailPageTemplate
      leftWidth={420}
      minLeft={360}
      leftPane={
        <SearchPanel
          query={execution.query}
          isSearching={execution.isSearching}
          searchModeLabel={searchModeLabel}
          activeConfigBadges={params.activeConfigBadges}
          onQueryChange={execution.setQuery}
          onSearch={execution.handleSearchSubmit}
          onOpenConfig={configPanel.openPanel}
        />
      }
      rightPane={
        <div className="relative h-full min-h-0 overflow-hidden bg-background-surface">
          <ResultPanel
            query={execution.query}
            isSearching={execution.isSearching}
            results={execution.results}
            totalResults={execution.totalResults}
            docAggs={execution.docAggs}
            selectedDocIds={execution.selectedDocIds}
            showDocFilter={execution.showDocFilter}
            highlight={params.searchParams.highlight}
            similarityThreshold={params.searchParams.similarity_threshold}
            currentPage={execution.currentPage}
            pageSize={execution.pageSize}
            totalPages={execution.totalPages}
            pageNumbers={execution.pageNumbers}
            onToggleDocFilter={execution.toggleDocFilter}
            onDocFilter={execution.handleDocFilter}
            onClearDocFilter={execution.handleClearDocFilter}
            onSelectAllDocs={execution.handleSelectAllDocs}
            onOpenResultPreview={(result) => {
              configPanel.closePanel()
              preview.openPreview(result)
            }}
            onPageChange={execution.handlePageChange}
            onPageSizeChange={execution.handlePageSizeChange}
          />

          <ConfigPanelSheet
            open={configPanel.open}
            onClose={configPanel.closePanel}
            onApply={handleApplyConfig}
            searchModeLabel={searchModeLabel}
            searchMode={params.searchMode}
            onSearchModeChange={params.setSearchMode}
            advancedOpen={configPanel.advancedOpen}
            onToggleAdvanced={configPanel.toggleAdvanced}
            pageSize={execution.pageSize}
            onPageSizeChange={execution.handlePageSizeChange}
            searchParams={params.searchParams}
            onSearchParamsChange={params.setSearchParams}
            rerankModels={rerankQuery.data ?? []}
            rerankLoading={rerankQuery.isLoading}
            rerankError={rerankErrorText}
            onSelectRerank={handleRerankSelect}
            selectedLanguages={params.selectedLanguages}
            onSelectedLanguagesChange={params.setSelectedLanguages}
            metadataMode={params.metadataMode}
            onMetadataModeChange={params.setMetadataMode}
            metadataCondition={params.metadataCondition}
            onMetadataConditionChange={params.setMetadataCondition}
            metadataSemiAutoFields={params.metadataSemiAutoFields}
            onMetadataSemiAutoFieldsChange={params.setMetadataSemiAutoFields}
            metadataFields={metadataFields}
          />

          <ResultPreviewModal
            result={preview.selectedResult}
            highlightEnabled={params.searchParams.highlight}
            isMarkdownPreview={preview.isMarkdownPreview}
            onTogglePreview={preview.togglePreview}
            onClose={preview.closePreview}
          />
        </div>
      }
    />
  )
}

export { KnowledgeSearchPage }
