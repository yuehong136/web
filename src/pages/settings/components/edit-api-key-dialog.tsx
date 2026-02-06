import React, { memo, useEffect, useState } from 'react'
import { Edit2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { SystemAPIToken } from '@/types/api'

export interface EditApiKeySubmitData {
  name: string
  description: string | null
}

interface EditApiKeyDialogProps {
  apiKey: SystemAPIToken | null
  isLoading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: EditApiKeySubmitData) => Promise<void> | void
}

export const EditApiKeyDialog: React.FC<EditApiKeyDialogProps> = memo(({
  apiKey,
  isLoading = false,
  onOpenChange,
  onSubmit,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!apiKey) {
      setName('')
      setDescription('')
      setSubmitError('')
      return
    }

    setName(apiKey.name)
    setDescription(apiKey.description ?? '')
    setSubmitError('')
  }, [apiKey])

  const handleClose = () => {
    if (isLoading) return
    onOpenChange(false)
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      handleClose()
      return
    }
    onOpenChange(true)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setSubmitError('请输入 API Key 名称')
      return
    }

    setSubmitError('')

    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim() || null,
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '保存失败，请稍后重试')
    }
  }

  return (
    <Dialog open={!!apiKey} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        size="lg"
        className="max-w-2xl"
        showCloseButton={!isLoading}
        closeOnOverlayClick={!isLoading}
      >
        <DialogHeader>
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-radius-lg bg-surface-secondary flex items-center justify-center">
              <Edit2 className="w-icon-md h-icon-md text-text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle>编辑 API Key</DialogTitle>
              <DialogDescription>修改 API Key 的名称和描述</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-space-lg py-space-base space-y-space-base">
            <div className="space-y-space-xs">
              <Label htmlFor="edit-api-key-name">
                名称 <span className="text-status-error">*</span>
              </Label>
              <Input
                id="edit-api-key-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  if (submitError) setSubmitError('')
                }}
                placeholder="输入 API Key 名称"
                disabled={isLoading}
                autoFocus
                maxLength={64}
              />
            </div>

            <div className="space-y-space-xs">
              <Label htmlFor="edit-api-key-description">描述</Label>
              <Textarea
                id="edit-api-key-description"
                value={description}
                onChange={(event) => {
                  setDescription(event.target.value)
                  if (submitError) setSubmitError('')
                }}
                placeholder="输入 API Key 描述（可选）"
                rows={4}
                disabled={isLoading}
                maxLength={500}
              />
            </div>

            {submitError && (
              <p className="text-sm text-status-error">{submitError}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading && <Loader2 className="w-icon-sm h-icon-sm mr-space-sm animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})

EditApiKeyDialog.displayName = 'EditApiKeyDialog'
