import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { RetrievalDocAgg } from './types'

interface DocFilterPanelProps {
  options: RetrievalDocAgg[]
  selectedDocIds: string[]
  open: boolean
  onToggle: () => void
  onDocFilter: (docId: string, checked: boolean) => void
  onClear: () => void
  onSelectAll: () => void
}

export function DocFilterPanel({
  options,
  selectedDocIds,
  open,
  onToggle,
  onDocFilter,
  onClear,
  onSelectAll,
}: DocFilterPanelProps) {
  const { t } = useTranslation()
  if (!options.length && !selectedDocIds.length) return null
  return (
    <div className="mt-space-base border-t border-border-default pt-space-base">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <button
          onClick={onToggle}
          aria-expanded={open}
          aria-controls="search-document-options"
          className="flex items-center gap-space-xs text-sm font-medium text-text-secondary hover:text-text-primary"
        >
          <FileText className="size-icon-sm" />
          <span>{t('knowledge.search.docFilter')}</span>
          {selectedDocIds.length > 0 && (
            <Badge variant="secondary">{selectedDocIds.length}</Badge>
          )}
          {open ? (
            <ChevronUp className="size-icon-sm" />
          ) : (
            <ChevronDown className="size-icon-sm" />
          )}
        </button>
        <div className="flex items-center gap-space-sm">
          {selectedDocIds.length > 0 && (
            <Button size="sm" variant="ghost" onClick={onClear}>
              {t('knowledge.search.scope.clearDocuments')}
            </Button>
          )}
          {options.length > 0 && (
            <Button size="sm" variant="outline" onClick={onSelectAll}>
              {t('knowledge.search.scope.selectListed')}
            </Button>
          )}
        </div>
      </div>
      {open && (
        <div
          id="search-document-options"
          className="mt-space-sm space-y-space-sm"
        >
          <p className="text-xs text-text-tertiary">
            {t('knowledge.search.scope.documentHelp')}
          </p>
          <div className="flex flex-wrap gap-space-xs">
            {options.map((doc) => (
              <label
                key={doc.doc_id}
                htmlFor={`search-document-${doc.doc_id}`}
                className="flex cursor-pointer items-center gap-space-xs rounded-radius-full border border-border-default bg-background-subtle px-space-sm py-space-xs hover:bg-components-card-bg-hover"
              >
                <Checkbox
                  id={`search-document-${doc.doc_id}`}
                  checked={selectedDocIds.includes(doc.doc_id)}
                  onCheckedChange={(checked) =>
                    onDocFilter(doc.doc_id, checked === true)
                  }
                />
                <span className="max-w-xs truncate text-sm text-text-secondary">
                  {doc.doc_name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
