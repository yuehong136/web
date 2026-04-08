import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/lib/toast'
import { PenLine } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useChangeNodeName } from '../../../hooks/use-change-node-name'
import type { RAGFlowNodeType } from '../../../types'

interface NodeTitleInputProps {
  node?: RAGFlowNodeType
  titleEditable: boolean
}

export function NodeTitleInput({
  node,
  titleEditable,
}: NodeTitleInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(node?.data?.name || '')
  const { changeNodeName, validateNodeName } = useChangeNodeName()

  useEffect(() => {
    setDraftName(node?.data?.name || '')
    setIsEditing(false)
  }, [node?.data?.name, node?.id])

  useLayoutEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const commitNodeName = useCallback(() => {
    if (!titleEditable || !node?.id) {
      setIsEditing(false)
      return true
    }

    const nextName = draftName.trim()
    const validation = validateNodeName(node.id, nextName)
    if (!validation.valid) {
      toast.error(validation.error || '节点名称无效')
      return false
    }

    const changed = changeNodeName(node.id, nextName)
    if (!changed) {
      toast.error('节点名称已存在')
      return false
    }

    setIsEditing(false)
    return true
  }, [
    changeNodeName,
    draftName,
    node?.id,
    titleEditable,
    validateNodeName,
  ])

  const handleBlur = useCallback(() => {
    const committed = commitNodeName()
    if (!committed) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [commitNodeName])

  if (!titleEditable) {
    return (
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-medium text-text-primary">
          {node?.data?.name || node?.data?.label || '未命名节点'}
        </div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="min-w-0 flex-1">
        <Input
          ref={inputRef}
          value={draftName}
          onBlur={handleBlur}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleBlur()
            }
            if (event.key === 'Escape') {
              setDraftName(node?.data?.name || '')
              setIsEditing(false)
            }
          }}
          className="h-9"
          placeholder="输入节点标题"
        />
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-space-xs">
      <div className="truncate text-base font-medium text-text-primary">
        {node?.data?.name || node?.data?.label || '未命名节点'}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 text-text-secondary hover:text-text-primary"
        onClick={() => setIsEditing(true)}
      >
        <PenLine className="size-3.5" />
      </Button>
    </div>
  )
}
