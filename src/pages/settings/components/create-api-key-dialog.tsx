import React, { memo, useEffect, useState } from 'react'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface CreateApiKeySubmitData {
  name: string
  description: string | null
}

interface CreateApiKeyDialogProps {
  open: boolean
  isLoading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateApiKeySubmitData) => Promise<void> | void
}

export const CreateApiKeyDialog: React.FC<CreateApiKeyDialogProps> = memo(({
  open,
  isLoading = false,
  onOpenChange,
  onSubmit,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitError, setSubmitError] = useState('')

  const resetForm = () => {
    setName('')
    setDescription('')
    setSubmitError('')
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  const handleClose = () => {
    if (isLoading) return
    resetForm()
    onOpenChange(false)
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
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
      resetForm()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '创建失败，请稍后重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        size="lg"
        className="max-w-2xl"
        showCloseButton={!isLoading}
        closeOnOverlayClick={!isLoading}
      >
        <DialogHeader>
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-radius-lg bg-surface-secondary flex items-center justify-center">
              <Plus className="w-icon-md h-icon-md text-text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle>创建 API Key</DialogTitle>
              <DialogDescription>创建新的 API Key 用于访问接口</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-space-lg py-space-base space-y-space-base">
            <div className="space-y-space-xs">
              <Label htmlFor="create-api-key-name">
                名称 <span className="text-status-error">*</span>
              </Label>
              <Input
                id="create-api-key-name"
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
              <Label htmlFor="create-api-key-description">描述</Label>
              <Textarea
                id="create-api-key-description"
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
              创建
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
})

CreateApiKeyDialog.displayName = 'CreateApiKeyDialog'
