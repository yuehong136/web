import React, { memo, useMemo } from 'react'
import { FileText } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type { DocAgg } from '@/types/search'

interface SearchDocFilterRailProps {
  docAggs: DocAgg[]
  selectedDocIds: string[]
  onSelectionChange: (docIds: string[]) => void
}

const SearchDocFilterRail: React.FC<SearchDocFilterRailProps> = ({
  docAggs,
  selectedDocIds,
  onSelectionChange,
}) => {
  const allIds = useMemo(() => docAggs.map((doc) => doc.doc_id), [docAggs])
  if (!docAggs.length) return null

  const isSelectAll = selectedDocIds.length === 0 || selectedDocIds.length === allIds.length

  const handleToggle = (docId: string) => {
    if (selectedDocIds.length === 0) {
      onSelectionChange(allIds.filter((id) => id !== docId))
      return
    }

    if (selectedDocIds.includes(docId)) {
      const next = selectedDocIds.filter((id) => id !== docId)
      onSelectionChange(next.length === 0 ? [] : next)
      return
    }

    onSelectionChange([...selectedDocIds, docId])
  }

  return (
    <div className="rounded-radius-lg border border-border-default bg-surface-primary p-space-sm">
      <div className="mb-space-sm flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">Sources</span>
        {!isSelectAll ? (
          <button
            type="button"
            className="text-xs text-text-accent hover:underline"
            onClick={() => onSelectionChange([])}
          >
            Reset
          </button>
        ) : null}
      </div>

      <div className="space-y-space-xs max-h-[260px] overflow-y-auto">
        {docAggs.map((doc) => {
          const checked = selectedDocIds.length === 0 || selectedDocIds.includes(doc.doc_id)
          return (
            <label
              key={doc.doc_id}
              className={`
                flex cursor-pointer items-center gap-space-xs rounded-radius-md border px-space-xs py-space-xs transition-colors
                ${checked ? 'border-border-default bg-surface-secondary' : 'border-border-default bg-surface-primary hover:bg-surface-secondary'}
              `}
            >
              <Checkbox checked={checked} onCheckedChange={() => handleToggle(doc.doc_id)} />
              <FileText className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
              <span className="flex-1 min-w-0 text-sm text-text-primary truncate">{doc.doc_name}</span>
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-radius-full bg-surface-secondary px-space-xs text-xs text-text-tertiary">
                {doc.count}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default memo(SearchDocFilterRail)
