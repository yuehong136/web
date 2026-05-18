import { RefreshCw, Search, Tag, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Card, Input } from '@/components/ui'
import { FilterButton } from '../document-filter-popover'
import { GenerateButton } from '../generate'
import type { DocumentListState, FilterCollection } from '../types'
import type { useGenerateState } from '../generate/hooks'

type GenerateState = ReturnType<typeof useGenerateState>

interface DocumentPageToolbarProps {
  listState: DocumentListState
  filterCollections: FilterCollection[]
  filterGroup: Record<string, string[]>
  generate: GenerateState
  chunkNum: number
  onOpenMetadata: () => void
  onOpenUpload: () => void
}

export function DocumentPageToolbar({
  listState,
  filterCollections,
  filterGroup,
  generate,
  chunkNum,
  onOpenMetadata,
  onOpenUpload,
}: DocumentPageToolbarProps) {
  const { t } = useTranslation()

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-4">
          <div className="max-w-md flex-1">
            <Input
              type="search"
              placeholder={t('knowledge.documents.searchPlaceholder')}
              value={listState.searchKeywords}
              onChange={(e) => listState.setSearchKeywords(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <FilterButton
            filters={filterCollections}
            value={listState.filterValue}
            onChange={listState.setFilterValue}
            filterCount={listState.filterCount}
            filterGroup={filterGroup}
            onOpenChange={(open) => {
              if (open) {
                listState.refreshFilterOptions()
              }
            }}
          />
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={listState.refetch}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${listState.isFetching ? 'animate-spin' : ''}`}
            />
            {t('knowledge.common.refresh')}
          </Button>
          <GenerateButton
            disabled={chunkNum <= 0}
            graphStatus={generate.graph.status}
            raptorStatus={generate.raptor.status}
            graphTrace={generate.graph.traceData}
            raptorTrace={generate.raptor.traceData}
            isActionPending={generate.isActionPending}
            onRun={generate.handleRun}
            onPause={generate.handlePause}
            onDelete={generate.handleDeleteRequest}
          />
          <Button variant="outline" onClick={onOpenMetadata}>
            <Tag className="mr-2 h-4 w-4" />
            {t('knowledge.documents.manageMetadata')}
          </Button>
          <Button onClick={onOpenUpload}>
            <Upload className="mr-2 h-4 w-4" />
            {t('knowledge.documents.import')}
          </Button>
        </div>
      </div>
    </Card>
  )
}
