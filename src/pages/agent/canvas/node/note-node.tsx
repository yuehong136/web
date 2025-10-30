import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { StickyNote } from 'lucide-react'

function InnerNoteNode({ data, selected }: NodeProps) {
  const noteText = (data.form as any)?.text || '备注...'
  
  return (
    <div className={`min-w-[200px] min-h-[100px] bg-yellow-100 border-2 ${selected ? 'border-yellow-500' : 'border-yellow-300'} rounded-lg p-4 shadow-md note-drag-handle cursor-move`}>
      <div className="flex items-center gap-2 mb-2">
        <StickyNote className="w-4 h-4 text-yellow-700" />
        <div className="text-sm font-semibold text-yellow-900">{data.name as string}</div>
      </div>
      <div className="text-xs text-yellow-800 whitespace-pre-wrap">
        {noteText}
      </div>
    </div>
  )
}

export const NoteNode = memo(InnerNoteNode)

