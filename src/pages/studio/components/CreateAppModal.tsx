import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AppWindow, ImagePlus, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  type DialogContentProps,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useSetDialogApp } from '@/hooks/use-dialog-apps'
import { ROUTES } from '@/constants'

type ValidationIssue =
  | 'nameRequired'
  | 'nameTooLong'
  | 'descriptionRequired'
  | 'iconType'
  | 'iconSize'
  | 'iconRead'
interface CreateAppModalProps {
  isOpen: boolean
  onClose: () => void
  returnFocusRef?: DialogContentProps['returnFocusRef']
  onCreate?: (appData: {
    name: string
    description: string
    icon?: string
  }) => void
}
export function CreateAppModal({
  isOpen,
  onClose,
  returnFocusRef,
  onCreate,
}: CreateAppModalProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const id = useId()
  const [form, setForm] = useState({ name: '', description: '', icon: '' })
  const [issue, setIssue] = useState<ValidationIssue | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const reader = useRef<FileReader | null>(null)
  const mutation = useSetDialogApp()
  useEffect(() => () => reader.current?.abort(), [])
  const close = () => {
    if (mutation.isPending) return
    reader.current?.abort()
    setForm({ name: '', description: '', icon: '' })
    setIssue(null)
    onClose()
  }
  const uploadIcon = (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) {
      setIssue('iconType')
      return
    }
    if (file.size >= 2 * 1024 * 1024) {
      setIssue('iconSize')
      return
    }
    reader.current?.abort()
    const next = new FileReader()
    reader.current = next
    next.onload = () => {
      if (typeof next.result === 'string') {
        const icon = next.result
        setForm((current) => ({ ...current, icon }))
        setIssue(null)
      }
    }
    next.onerror = () => setIssue('iconRead')
    next.readAsDataURL(file)
  }
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (mutation.isPending) return
    if (!form.name.trim()) {
      setIssue('nameRequired')
      return
    }
    if (new TextEncoder().encode(form.name).length > 255) {
      setIssue('nameTooLong')
      return
    }
    if (!form.description.trim()) {
      setIssue('descriptionRequired')
      return
    }
    setIssue(null)
    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
    }
    mutation.mutate(payload, {
      onSuccess: (created) => {
        const params = new URLSearchParams({
          id: created.id,
          name: payload.name,
          description: payload.description,
          ...(payload.icon && { icon: payload.icon }),
        })
        setForm({ name: '', description: '', icon: '' })
        onClose()
        onCreate?.(payload)
        navigate(`${ROUTES.STUDIO_CREATE_APP}?${params}`)
      },
    })
  }
  const nameInvalid = issue === 'nameRequired' || issue === 'nameTooLong'
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <DialogContent size="md" modal returnFocusRef={returnFocusRef}>
        <DialogHeader>
          <DialogTitle>{t('studio.createApp.title')}</DialogTitle>
          <DialogDescription>
            {t('studio.createApp.description')}
          </DialogDescription>
        </DialogHeader>
        <form
          id={id}
          onSubmit={submit}
          noValidate
          className="space-y-space-lg overflow-y-auto p-space-lg"
        >
          <div className="space-y-space-sm">
            <Label htmlFor={`${id}-icon`}>{t('studio.createApp.icon')}</Label>
            <div className="flex items-center gap-space-md">
              <span className="flex size-icon-2xl items-center justify-center overflow-hidden rounded-radius-lg border border-border-default bg-background-subtle">
                {form.icon ? (
                  <img
                    src={form.icon}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <AppWindow
                    className="size-icon-lg text-text-secondary"
                    aria-hidden="true"
                  />
                )}
              </span>
              <Input
                ref={input}
                id={`${id}-icon`}
                type="file"
                accept="image/jpeg,image/png,image/svg+xml"
                className="sr-only"
                tabIndex={-1}
                disabled={mutation.isPending}
                onChange={(event) => {
                  uploadIcon(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={mutation.isPending}
                onClick={() => input.current?.click()}
              >
                <ImagePlus className="size-icon-sm" aria-hidden="true" />
                {t('studio.createApp.uploadIcon')}
              </Button>
              {form.icon && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('studio.createApp.removeIcon')}
                  disabled={mutation.isPending}
                  onClick={() =>
                    setForm((current) => ({ ...current, icon: '' }))
                  }
                >
                  <Trash2 className="size-icon-sm" aria-hidden="true" />
                </Button>
              )}
            </div>
            <p className="text-xs text-text-tertiary">
              {t('studio.createApp.iconHint')}
            </p>
          </div>
          <div className="space-y-space-sm">
            <Label htmlFor={`${id}-name`}>{t('studio.createApp.name')}</Label>
            <Input
              id={`${id}-name`}
              value={form.name}
              required
              autoComplete="off"
              disabled={mutation.isPending}
              aria-invalid={nameInvalid || undefined}
              aria-describedby={nameInvalid ? `${id}-error` : undefined}
              placeholder={t('studio.createApp.namePlaceholder')}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
            />
            <p className="text-xs text-text-tertiary">
              {t('studio.createApp.nameHint')}
            </p>
          </div>
          <div className="space-y-space-sm">
            <Label htmlFor={`${id}-description`}>
              {t('studio.createApp.appDescription')}
            </Label>
            <Textarea
              id={`${id}-description`}
              value={form.description}
              required
              maxLength={200}
              rows={4}
              disabled={mutation.isPending}
              aria-invalid={issue === 'descriptionRequired' || undefined}
              aria-describedby={
                issue === 'descriptionRequired' ? `${id}-error` : undefined
              }
              placeholder={t('studio.createApp.descriptionPlaceholder')}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
            <p className="text-right text-xs text-text-tertiary">
              {form.description.length} / 200
            </p>
          </div>
          {issue && (
            <p
              id={`${id}-error`}
              role="alert"
              className="text-sm text-status-error"
            >
              {t(`studio.createApp.validation.${issue}`)}
            </p>
          )}
        </form>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={close}
            disabled={mutation.isPending}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={id} loading={mutation.isPending}>
            {t('studio.createApp.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
