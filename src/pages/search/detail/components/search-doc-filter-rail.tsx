import { memo, useId, useState } from 'react'
import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { DocAgg } from '@/types/search'

interface SearchDocFilterRailProps {
  docAggs: DocAgg[]
  /** null means all documents; [] intentionally means no documents. */
  selectedDocIds: string[] | null
  onSelectionChange: (docIds: string[] | null) => void
}
const PAGE_SIZE = 100

function SearchDocFilterRail({
  docAggs,
  selectedDocIds,
  onSelectionChange,
}: SearchDocFilterRailProps) {
  const { t } = useTranslation()
  const id = useId()
  const [page, setPage] = useState(0)
  if (!docAggs.length) return null
  const pages = Math.ceil(docAggs.length / PAGE_SIZE)
  const currentPage = Math.min(page, pages - 1)
  const visible = docAggs.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  )
  const toggle = (docId: string) => {
    const selected = selectedDocIds ?? docAggs.map((doc) => doc.doc_id)
    onSelectionChange(
      selected.includes(docId)
        ? selected.filter((item) => item !== docId)
        : [...selected, docId],
    )
  }
  return (
    <fieldset className="min-w-0 rounded-radius-lg border border-border-subtle bg-background-subtle p-space-base">
      <legend className="px-space-xs text-sm font-semibold text-text-primary">
        {t('searchPage.workspace.sources')}
      </legend>
      {selectedDocIds !== null && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectionChange(null)}
        >
          {t('searchPage.workspace.reset')}
        </Button>
      )}
      <div className="max-h-72 space-y-space-xs overflow-y-auto overscroll-contain">
        {visible.map((doc, index) => (
          <label
            key={doc.doc_id}
            htmlFor={`${id}-${currentPage}-${index}`}
            className="flex min-w-0 cursor-pointer items-center gap-space-sm rounded-radius-md p-space-xs text-sm hover:bg-state-hover"
          >
            <Checkbox
              id={`${id}-${currentPage}-${index}`}
              checked={
                selectedDocIds === null || selectedDocIds.includes(doc.doc_id)
              }
              onCheckedChange={() => toggle(doc.doc_id)}
            />
            <FileText
              className="size-icon-sm shrink-0 text-text-secondary"
              aria-hidden="true"
            />
            <span
              className="min-w-0 flex-1 truncate text-text-primary"
              title={doc.doc_name}
            >
              {doc.doc_name}
            </span>
            <span className="text-xs text-text-secondary tabular-nums">
              {doc.count}
            </span>
          </label>
        ))}
      </div>
      {pages > 1 && (
        <div className="mt-space-base flex items-center justify-between gap-space-xs">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            {t('searchPage.pagination.previous')}
          </Button>
          <span className="text-xs text-text-secondary">
            {currentPage + 1}/{pages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage + 1 === pages}
            onClick={() => setPage(currentPage + 1)}
          >
            {t('searchPage.pagination.next')}
          </Button>
        </div>
      )}
    </fieldset>
  )
}

export default memo(SearchDocFilterRail)
