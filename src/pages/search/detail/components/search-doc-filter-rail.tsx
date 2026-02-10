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
    <div className="rounded-radius-xl border border-border-default bg-surface-primary p-space-sm">
      <div className="flex items-center justify-between mb-space-xs">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-text-tertiary" />
          <span className="text-sm font-medium text-text-primary">来源文档</span>
        </div>
        <button
          type="button"
          className="text-xs text-text-accent hover:underline"
          onClick={() => onSelectionChange([])}
        >
          {isSelectAll ? '全部' : '重置'}
        </button>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {docAggs.map((doc) => {
          const checked = selectedDocIds.length === 0 || selectedDocIds.includes(doc.doc_id)
          return (
            <label key={doc.doc_id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={checked} onCheckedChange={() => handleToggle(doc.doc_id)} />
              <span className="flex-1 min-w-0 text-sm text-text-secondary truncate">{doc.doc_name}</span>
              <span className="text-xs text-text-tertiary">{doc.count}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default memo(SearchDocFilterRail)
