/**
 * 创建应用弹窗
 * 使用设计令牌重写
 */

import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ImagePlus, Trash2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/lib/toast'
import { useSetDialogApp } from '@/hooks/use-dialog-apps'
import { ROUTES } from '@/constants'
import { STUDIO_TEXTS } from '@/constants/studio-texts'
import { EntityAvatar } from '@/components/patterns/entity-avatar'

interface CreateAppModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate?: (appData: {
    name: string
    description: string
    icon?: string
  }) => void
}

export const CreateAppModal: React.FC<CreateAppModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
  })

  const [nameError, setNameError] = useState<string | null>(null)
  const setDialogAppMutation = useSetDialogApp()

  const handleIconUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const isJpgOrPng =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/svg+xml'
      if (!isJpgOrPng) {
        toast.error('只能上传 JPG/PNG/SVG 格式的图片!')
        return
      }
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        toast.error('图片大小不能超过 2MB!')
        return
      }

      // 转换为base64
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setFormData((prev) => ({ ...prev, icon: result }))
      }
      reader.readAsDataURL(file)
    },
    [],
  )

  const validateName = useCallback((name: string): string | null => {
    if (name.trim() === '') {
      return STUDIO_TEXTS.createAppModal.nameRequired
    }

    // 检查UTF-8字节长度是否超过255
    const byteLength = new TextEncoder().encode(name).length
    if (byteLength > 255) {
      return STUDIO_TEXTS.createAppModal.nameMaxLength
    }

    return null
  }, [])

  const handleClose = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      icon: '',
    })
    setNameError(null)
    onClose()
  }, [onClose])

  const handleCreate = useCallback(() => {
    // 验证应用名称
    const error = validateName(formData.name)
    if (error) {
      toast.error(error)
      return
    }

    if (!formData.description.trim()) {
      toast.error('请输入应用描述')
      return
    }

    // 使用新的API创建应用
    setDialogAppMutation.mutate(
      {
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
      },
      {
        onSuccess: (createdApp) => {
          handleClose()
          // 跳转到应用配置页面
          const searchParams = new URLSearchParams({
            id: createdApp.id,
            name: formData.name,
            description: formData.description,
            ...(formData.icon && { icon: formData.icon }),
          })
          navigate(`${ROUTES.STUDIO_CREATE_APP}?${searchParams.toString()}`)

          // 如果有回调函数，也调用它（兼容性）
          onCreate?.(formData)
        },
      },
    )
  }, [
    formData,
    handleClose,
    navigate,
    onCreate,
    setDialogAppMutation,
    validateName,
  ])

  const handleNameChange = useCallback(
    (value: string) => {
      setFormData((prev) => ({ ...prev, name: value }))
      setNameError(validateName(value))
    },
    [validateName],
  )

  const isLoading = setDialogAppMutation.isPending

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-state-selected-bg text-state-selected-text">
              <Sparkles className="size-icon-md" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-text-primary">
                {STUDIO_TEXTS.createAppModal.title}
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                创建一个新的对话应用，配置模型参数和提示词
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(80vh-200px)] space-y-6 overflow-y-auto px-6 py-4">
          {/* 应用图标 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-text-primary">
              {STUDIO_TEXTS.createAppModal.iconLabel}
            </Label>
            <div className="flex items-center gap-4">
              <EntityAvatar
                name={formData.name}
                src={formData.icon}
                size="2xl"
                icon={formData.name.trim() ? undefined : <Sparkles />}
              />
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml"
                    onChange={handleIconUpload}
                    className="hidden"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="pointer-events-none gap-1.5"
                    disabled={isLoading}
                  >
                    <ImagePlus className="h-4 w-4" />
                    {STUDIO_TEXTS.createAppModal.iconUpload}
                  </Button>
                </label>
                {formData.icon && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, icon: '' }))
                    }
                    className="gap-1.5 text-status-error hover:bg-status-error-subtle hover:text-status-error"
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                    移除图标
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-text-tertiary">
              {STUDIO_TEXTS.createAppModal.iconTip}
            </p>
          </div>

          {/* 应用名称 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-text-primary">
              {STUDIO_TEXTS.createAppModal.nameLabel}{' '}
              <span className="text-status-error">*</span>
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={STUDIO_TEXTS.createAppModal.namePlaceholder}
              disabled={isLoading}
              variant={nameError ? 'destructive' : 'default'}
              aria-invalid={!!nameError}
            />
            {nameError && (
              <p className="text-xs text-status-error">{nameError}</p>
            )}
            <p className="text-xs text-text-tertiary">
              最多255字节（中文字符约85个字）
            </p>
          </div>

          {/* 应用描述 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-text-primary">
                {STUDIO_TEXTS.createAppModal.descriptionLabel}{' '}
                <span className="text-status-error">*</span>
              </Label>
              <span className="text-xs text-text-tertiary">
                {formData.description.length}/200
              </span>
            </div>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value.slice(0, 200),
                }))
              }
              placeholder={STUDIO_TEXTS.createAppModal.descriptionPlaceholder}
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* 提示信息 */}
          <div className="flex items-start gap-2.5 rounded-lg border border-status-info-border bg-status-info-subtle p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-status-info" />
            <p className="text-xs leading-relaxed text-text-secondary">
              <strong className="text-text-primary">提示：</strong>
              创建应用后，您将进入应用配置页面，可以设置模型参数、提示词模板、对话记忆等高级功能。
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {STUDIO_TEXTS.common.cancel}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isLoading}
            className="gap-1.5"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? '创建中...' : STUDIO_TEXTS.createApp}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
