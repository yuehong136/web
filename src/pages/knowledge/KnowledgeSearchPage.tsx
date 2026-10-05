import React from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { SplitDetailPageTemplate } from '@/components/page-templates'
import { useMetadataFieldKeys } from '@/hooks/use-metadata'
import { metadataConfigToFields } from '@/lib/metadata-config'
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request'

import {
  ConfigPanelSheet,
  ResultPanel,
  ResultPreviewModal,
  SearchPanel,
  createActiveMetaDataFilter,
  useConfigPanelUi,
  useFetchRerankLLMs,
  useResultPreview,
  useSearchExecution,
  useSearchModeOptions,
  useSearchParamsState,
  type SearchConfigState,
} from './search-workbench'

const KnowledgeSearchWorkbench: React.FC<{ id?: string }> = ({ id }) => {
  const { t } = useTranslation()
  const metadataKeysQuery = useMetadataFieldKeys(id)
  const { knowledgeBase: currentKnowledgeBase } = useFetchKnowledgeDetail(id)

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

  const metadataFields = React.useMemo(
    () => [
      ...new Set(
        [
          ...(metadataKeysQuery.data ?? []),
          ...metadataConfigToFields(
            currentKnowledgeBase?.parser_config?.metadata,
          ).map((field) => field.key),
          ...metadataConfigToFields(
            currentKnowledgeBase?.parser_config?.built_in_metadata,
          ).map((field) => field.key),
          ...(currentKnowledgeBase?.metadata_settings ?? []).map(
            (field) => field.key,
          ),
        ].filter((key): key is string => Boolean(key)),
      ),
    ],
    [currentKnowledgeBase, metadataKeysQuery.data],
  )

  const searchModeLabel =
    searchModeOptions.find((option) => option.value === params.searchMode.type)
      ?.label || t('knowledge.search.config.fallbackMode')
  const createConfigSnapshot = React.useCallback(
    (): SearchConfigState => ({
      searchParams: { ...params.searchParams },
      searchMode: { ...params.searchMode },
      pageSize: execution.pageSize,
      selectedLanguages: [...params.selectedLanguages],
      metadataMode: params.metadataMode,
      metadataCondition: {
        ...params.metadataCondition,
        conditions: [...(params.metadataCondition.conditions || [])],
      },
      metadataSemiAutoFields: params.metadataSemiAutoFields.map((field) => ({
        ...field,
      })),
      activeMetaDataFilter: params.activeMetaDataFilter,
    }),
    [
      execution.pageSize,
      params.activeMetaDataFilter,
      params.metadataCondition,
      params.metadataMode,
      params.metadataSemiAutoFields,
      params.searchMode,
      params.searchParams,
      params.selectedLanguages,
    ],
  )

  const openConfigPanel = React.useCallback(() => {
    configPanel.openPanel()
  }, [configPanel])

  const closeConfigPanel = React.useCallback(() => {
    configPanel.closePanel()
  }, [configPanel])

  const rerankErrorText = rerankQuery.error
    ? t('knowledge.search.rerank.loadError')
    : undefined

  const handleApplyConfig = React.useCallback(
    (nextConfig: SearchConfigState) => {
      const activeMetaDataFilter = createActiveMetaDataFilter(nextConfig)

      params.setSearchMode(nextConfig.searchMode)
      params.setSearchParams(nextConfig.searchParams)
      params.setSelectedLanguages(nextConfig.selectedLanguages)
      params.setMetadataMode(nextConfig.metadataMode)
      params.setMetadataCondition(nextConfig.metadataCondition)
      params.setMetadataSemiAutoFields(nextConfig.metadataSemiAutoFields)
      execution.commitConfigPageSize(nextConfig.pageSize)
      configPanel.closePanel()

      if (execution.hasSearched && execution.query.trim()) {
        void execution.runSearch({
          page: 1,
          pageSize: nextConfig.pageSize,
          config: {
            searchParams: nextConfig.searchParams,
            searchMode: nextConfig.searchMode,
            selectedLanguages: nextConfig.selectedLanguages,
            activeMetaDataFilter,
          },
        })
      }
    },
    [configPanel, execution, params],
  )

  const configSnapshot = createConfigSnapshot()

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
          onOpenConfig={openConfigPanel}
        />
      }
      rightPane={
        <div className="relative h-full min-h-0 overflow-hidden bg-background-surface">
          <ResultPanel
            hasSearched={execution.hasSearched}
            searchError={execution.searchError}
            requestScope={execution.requestScope}
            docOptions={execution.docOptions}
            onRetry={execution.retrySearch}
            onOpenConfig={openConfigPanel}
            isSearching={execution.isSearching}
            results={execution.results}
            totalResults={execution.totalResults}
            docAggs={execution.docAggs}
            selectedDocIds={execution.selectedDocIds}
            showDocFilter={execution.showDocFilter}
            highlight={params.searchParams.highlight}
            currentPage={execution.currentPage}
            pageSize={execution.pageSize}
            totalPages={execution.totalPages}
            pageNumbers={execution.pageNumbers}
            onToggleDocFilter={execution.toggleDocFilter}
            onDocFilter={execution.handleDocFilter}
            onClearDocFilter={execution.handleClearDocFilter}
            onSelectAllDocs={execution.handleSelectAllDocs}
            onOpenResultPreview={(result) => {
              closeConfigPanel()
              preview.openPreview(result)
            }}
            onPageChange={execution.handlePageChange}
            onPageSizeChange={execution.handlePageSizeChange}
          />

          <ConfigPanelSheet
            open={configPanel.open}
            onClose={closeConfigPanel}
            onApply={handleApplyConfig}
            initialConfig={configSnapshot}
            advancedOpen={configPanel.advancedOpen}
            onToggleAdvanced={configPanel.toggleAdvanced}
            rerankModels={rerankQuery.data ?? []}
            rerankLoading={rerankQuery.isLoading}
            rerankError={rerankErrorText}
            metadataFields={metadataFields}
            metadataFieldsLoading={metadataKeysQuery.isLoading}
            metadataFieldsError={Boolean(metadataKeysQuery.error)}
            onRetryMetadataFields={() => {
              void metadataKeysQuery.refetch()
            }}
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

const KnowledgeSearchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  return <KnowledgeSearchWorkbench key={id} id={id} />
}

export { KnowledgeSearchPage }
