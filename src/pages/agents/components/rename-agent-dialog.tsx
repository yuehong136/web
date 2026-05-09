import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { resolveLocalizedText } from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'

interface RenameAgentDialogProps {
  flow: AgentFlow | null
  open: boolean
  isLoading?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (nextTitle: string) => void | Promise<void>
}

export function RenameAgentDialog({
  flow,
  open,
  isLoading = false,
  onOpenChange,
  onConfirm,
}: RenameAgentDialogProps) {
  const initialTitle = useMemo(
    () => resolveLocalizedText(flow?.title, ''),
    [flow?.title],
  )
  const [title, setTitle] = useState(initialTitle)

  useEffect(() => {
    if (open) {
      setTitle(initialTitle)
    }
  }, [initialTitle, open])

  const trimmed = title.trim()
  const disabled = !trimmed || trimmed === initialTitle.trim() || isLoading

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (disabled) {
      return
    }
    await onConfirm(trimmed)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>重命名 Agent</DialogTitle>
          </DialogHeader>
          <div className="px-space-xl pb-space-lg">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="输入 Agent 名称"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={disabled}>
              确认
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
