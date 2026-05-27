import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { StickyNote } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function InnerNoteNode({ data, selected }: NodeProps) {
  const { t } = useTranslation()
  const form = data.form as { text?: string } | undefined
  const noteText = form?.text || t('flow.notePlaceholder', 'Note...')

  return (
    <div
      className="note-drag-handle min-h-[100px] min-w-[200px] cursor-move rounded-lg border-2 p-4 shadow-md"
      style={{
        backgroundColor: 'var(--color-components-canvas-note-bg)',
        borderColor: selected
          ? 'var(--color-components-canvas-note-border-selected)'
          : 'var(--color-components-canvas-note-border)',
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <StickyNote
          className="h-4 w-4"
          style={{ color: 'var(--color-components-canvas-note-title)' }}
        />
        <div
          className="text-sm font-semibold"
          style={{ color: 'var(--color-components-canvas-note-title)' }}
        >
          {data.name as string}
        </div>
      </div>
      <div
        className="whitespace-pre-wrap text-xs"
        style={{ color: 'var(--color-components-canvas-note-text)' }}
      >
        {noteText}
      </div>
    </div>
  )
}

export const NoteNode = memo(InnerNoteNode)
