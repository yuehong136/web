import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { StickyNote } from 'lucide-react'

function InnerNoteNode({ data, selected }: NodeProps) {
  const noteText = (data.form as any)?.text || '备注...'
  
  return (
    <div 
      className="min-w-[200px] min-h-[100px] border-2 rounded-lg p-4 shadow-md note-drag-handle cursor-move"
      style={{
        backgroundColor: 'var(--color-components-canvas-note-bg)',
        borderColor: selected ? 'var(--color-components-canvas-note-border-selected)' : 'var(--color-components-canvas-note-border)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="w-4 h-4" style={{ color: 'var(--color-components-canvas-note-title)' }} />
        <div className="text-sm font-semibold" style={{ color: 'var(--color-components-canvas-note-title)' }}>{data.name as string}</div>
      </div>
      <div className="text-xs whitespace-pre-wrap" style={{ color: 'var(--color-components-canvas-note-text)' }}>
        {noteText}
      </div>
    </div>
  )
}

export const NoteNode = memo(InnerNoteNode)

