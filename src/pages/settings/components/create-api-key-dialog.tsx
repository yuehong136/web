import { memo, useEffect, useState, type FC, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'

export interface CreateApiKeySubmitData {
  name: string
  description: string | null
}

type SubmitError = 'nameRequired' | 'failed' | null

const submitErrorKeys = {
  nameRequired: 'settings.apiKeys.create.nameRequired',
  failed: 'settings.apiKeys.create.failed',
} as const

const ERROR_ID = 'create-api-key-error'

interface CreateApiKeyDialogProps {
  open: boolean
  isLoading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateApiKeySubmitData) => Promise<void> | void
}

export const CreateApiKeyDialog: FC<CreateApiKeyDialogProps> = memo(
  ({ open, isLoading = false, onOpenChange, onSubmit }) => {
    const { t } = useTranslation()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    // Store which fixed message to show, never the request's error text.
    const [submitError, setSubmitError] = useState<SubmitError>(null)

    const resetForm = () => {
      setName('')
      setDescription('')
      setSubmitError(null)
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

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const trimmedName = name.trim()

      if (!trimmedName) {
        setSubmitError('nameRequired')
        return
      }

      setSubmitError(null)

      try {
        await onSubmit({
          name: trimmedName,
          description: description.trim() || null,
        })
        resetForm()
      } catch (error) {
        // Sign-in expiry and cancellation are handled elsewhere; stay quiet.
        if (getMutationErrorNotice(error)) setSubmitError('failed')
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
              <div className="flex h-10 w-10 items-center justify-center rounded-radius-lg bg-surface-secondary">
                <Plus className="h-icon-md w-icon-md text-text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle>{t('settings.apiKeys.create.title')}</DialogTitle>
                <DialogDescription>
                  {t('settings.apiKeys.create.description')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-space-base px-space-lg py-space-base">
              <div className="space-y-space-xs">
                <Label htmlFor="create-api-key-name">
                  {t('settings.apiKeys.create.nameLabel')}{' '}
                  <span className="text-status-error" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Input
                  id="create-api-key-name"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value)
                    if (submitError) setSubmitError(null)
                  }}
                  placeholder={t('settings.apiKeys.create.namePlaceholder')}
                  disabled={isLoading}
                  autoFocus
                  aria-required="true"
                  maxLength={64}
                  aria-invalid={submitError === 'nameRequired'}
                  aria-describedby={submitError ? ERROR_ID : undefined}
                />
              </div>

              <div className="space-y-space-xs">
                <Label htmlFor="create-api-key-description">
                  {t('settings.apiKeys.create.descriptionLabel')}
                </Label>
                <Textarea
                  id="create-api-key-description"
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value)
                    if (submitError) setSubmitError(null)
                  }}
                  placeholder={t(
                    'settings.apiKeys.create.descriptionPlaceholder',
                  )}
                  rows={4}
                  disabled={isLoading}
                  maxLength={500}
                />
              </div>

              {submitError && (
                <p
                  id={ERROR_ID}
                  role="alert"
                  className="text-sm text-status-error"
                >
                  {t(submitErrorKeys[submitError])}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isLoading || !name.trim()}>
                {isLoading && (
                  <Loader2 className="mr-space-sm h-icon-sm w-icon-sm animate-spin" />
                )}
                {t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  },
)

CreateApiKeyDialog.displayName = 'CreateApiKeyDialog'
