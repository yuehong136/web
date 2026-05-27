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
import { useTranslation } from 'react-i18next'
import { useChangeNodeName } from '../../../hooks/use-change-node-name'
import type { RAGFlowNodeType } from '../../../types'

interface NodeTitleInputProps {
  node?: RAGFlowNodeType
  titleEditable: boolean
}

export function NodeTitleInput({ node, titleEditable }: NodeTitleInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draftName, setDraftName] = useState(node?.data?.name || '')
  const { changeNodeName, validateNodeName } = useChangeNodeName()
  const { t } = useTranslation()

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
      toast.error(
        validation.error || t('flow.invalidNodeName', 'Invalid node name'),
      )
      return false
    }

    const changed = changeNodeName(node.id, nextName)
    if (!changed) {
      toast.error(t('flow.duplicateNodeName', 'Node name already exists'))
      return false
    }

    setIsEditing(false)
    return true
  }, [changeNodeName, draftName, node?.id, t, titleEditable, validateNodeName])

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
          {node?.data?.name ||
            node?.data?.label ||
            t('flow.unnamedNode', 'Untitled node')}
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
          placeholder={t('flow.nodeTitlePlaceholder', 'Enter node title')}
        />
      </div>
    )
  }

  return (
    <div className="gap-space-xs flex min-w-0 flex-1 items-center">
      <div className="truncate text-base font-medium text-text-primary">
        {node?.data?.name ||
          node?.data?.label ||
          t('flow.unnamedNode', 'Untitled node')}
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
