import { Copy, Play, Trash2 } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { memo, useCallback } from 'react'
import { Operator } from '../../constant'
import useGraphStore from '../../store'

interface ToolBarProps extends PropsWithChildren {
  selected?: boolean
  id: string
  label: string
  showRun?: boolean
  showCopy?: boolean
}

export const ToolBar = memo(
  ({ children, selected, id, label, showRun, showCopy }: ToolBarProps) => {
    const { deleteNodeById, duplicateNode } = useGraphStore()

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        deleteNodeById(id)
      },
      [deleteNodeById, id],
    )

    const handleDuplicate = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        duplicateNode(id, label)
      },
      [duplicateNode, id, label],
    )

    const handleRun = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        console.log('Run node:', id)
        // TODO: 实现节点调试功能
      },
      [id],
    )

    return (
      <div className="relative group">
        {children}
        {selected && label !== Operator.Begin && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-1">
            {showRun && (
              <button
                onClick={handleRun}
                className="p-1 hover:bg-blue-50 rounded transition-colors"
                title="调试节点"
              >
                <Play className="w-4 h-4 text-blue-600" />
              </button>
            )}
            {showCopy && (
              <button
                onClick={handleDuplicate}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="复制节点"
              >
                <Copy className="w-4 h-4 text-gray-600" />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-red-50 rounded transition-colors"
              title="删除节点"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}
      </div>
    )
  },
)

ToolBar.displayName = 'ToolBar'

