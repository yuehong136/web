import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { StickyNote } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

function InnerNoteNode({ data, selected }: NodeProps) {
  const { t } = useTranslation()
  const form = data.form as { text?: string } | undefined
  const noteText = form?.text || t('flow.notePlaceholder', 'Note...')

  return (
    <div
      className={cn(
        'note-drag-handle min-h-[100px] min-w-[200px] cursor-move rounded-radius-lg border-2 bg-warning-soft p-space-base shadow-elevation-low transition-[border-color,box-shadow] hover:shadow-elevation-medium motion-reduce:transition-none',
        selected ? 'border-warning-solid' : 'border-warning-line',
      )}
    >
      <div className="mb-space-sm flex items-center gap-space-sm text-warning-fg">
        <StickyNote aria-hidden className="size-icon-sm shrink-0" />
        <div className="truncate text-sm font-semibold">
          {data.name as string}
        </div>
      </div>
      <div className="text-xs whitespace-pre-wrap text-fg">{noteText}</div>
    </div>
  )
}

export const NoteNode = memo(InnerNoteNode)
