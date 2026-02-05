import { Copy, Play, Trash2 } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { toast } from '@/lib/toast'
import useGraphStore from '../../store'

type CanvasContextMenuProps = {
  open: boolean
  position: { x: number; y: number }
  nodeId?: string | null
  onOpenChange: (open: boolean) => void
  onDebug?: (nodeId: string) => void
}

export function CanvasContextMenu({
  open,
  position,
  nodeId,
  onOpenChange,
  onDebug,
}: CanvasContextMenuProps) {
  const { t } = useTranslation()
  const { getNode, duplicateNode, deleteNodeById } = useGraphStore()

  const nodeName = useMemo(() => {
    if (!nodeId) return ''
    return getNode(nodeId)?.data?.name ?? ''
  }, [getNode, nodeId])

  const handleCopy = useCallback(() => {
    if (!nodeId) return
    const name = getNode(nodeId)?.data?.name ?? 'Node'
    duplicateNode(nodeId, name)
    onOpenChange(false)
  }, [duplicateNode, getNode, nodeId, onOpenChange])

  const handleDelete = useCallback(() => {
    if (!nodeId) return
    deleteNodeById(nodeId)
    onOpenChange(false)
  }, [deleteNodeById, nodeId, onOpenChange])

  const handleDebug = useCallback(() => {
    if (!nodeId) return
    if (onDebug) {
      onDebug(nodeId)
      onOpenChange(false)
      return
    }
    toast.info(t('flow.debugComingSoon', '单节点调试功能开发中'))
    onOpenChange(false)
  }, [nodeId, onDebug, onOpenChange, t])

  return (
    <ContextMenu open={open} onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild>
        <div className="fixed inset-0 pointer-events-none" />
      </ContextMenuTrigger>
      <ContextMenuContent
        style={{ position: 'fixed', top: position.y, left: position.x }}
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        {nodeName && <ContextMenuLabel>{nodeName}</ContextMenuLabel>}
        {nodeName && <ContextMenuSeparator />}
        <ContextMenuItem onSelect={handleCopy}>
          <Copy className="size-3.5 text-text-secondary" />
          {t('flow.copy', '复制')}
        </ContextMenuItem>
        <ContextMenuItem onSelect={handleDebug}>
          <Play className="size-3.5 text-text-secondary" />
          {t('flow.debug', '调试')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={handleDelete}>
          <Trash2 className="size-3.5 text-status-error" />
          {t('flow.delete', '删除')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
