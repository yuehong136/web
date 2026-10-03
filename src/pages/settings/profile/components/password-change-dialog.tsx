import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  ModalRoot,
  ModalContent,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal-primitives'
import { Input } from '@/components/ui/input'
import {
  passwordChangeSchema,
  type PasswordChangeFormData,
} from '@/pages/settings/profile/types'

interface PasswordChangeDialogProps {
  open: boolean
  loading: boolean
  onClose: () => void
  onSubmit: (data: PasswordChangeFormData) => Promise<boolean>
  returnFocus?: HTMLElement | null
}

export const PasswordChangeDialog = (props: PasswordChangeDialogProps) =>
  props.open ? <PasswordChangeForm {...props} /> : null

const fields = [
  {
    name: 'currPasswd',
    label: 'settings.profile.currentPassword',
    autoComplete: 'current-password',
  },
  {
    name: 'newPasswd',
    label: 'settings.profile.newPassword',
    autoComplete: 'new-password',
  },
  {
    name: 'confirmPasswd',
    label: 'settings.profile.confirmPassword',
    autoComplete: 'new-password',
  },
] as const

const PasswordChangeForm = ({
  open,
  loading,
  onClose,
  onSubmit,
  returnFocus,
}: PasswordChangeDialogProps) => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState<
    Record<keyof PasswordChangeFormData, boolean>
  >({ currPasswd: false, newPasswd: false, confirmPasswd: false })
  const form = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currPasswd: '', newPasswd: '', confirmPasswd: '' },
  })
  const handleSubmit = form.handleSubmit(async (data) => {
    if (await onSubmit(data)) {
      form.reset()
      onClose()
    }
  })
  return (
    <ModalRoot
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !loading) onClose()
      }}
    >
      <ModalContent className="max-w-md" returnFocus={returnFocus}>
        <div className="flex items-start justify-between gap-space-base border-b border-border-subtle p-space-lg">
          <div>
            <ModalTitle className="text-lg font-semibold">
              {t('settings.profile.changePassword')}
            </ModalTitle>
            <ModalDescription className="mt-space-xs text-sm text-text-secondary">
              {t('settings.profile.passwordDescription')}
            </ModalDescription>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('common.close')}
            onClick={onClose}
            disabled={loading}
          >
            <X className="size-icon-sm" />
          </Button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-space-base p-space-lg"
        >
          {fields.map(({ name, label, autoComplete }) => {
            const message = form.formState.errors[name]?.message
            return (
              <Input
                key={name}
                label={t(label)}
                type={visible[name] ? 'text' : 'password'}
                autoComplete={autoComplete}
                disabled={loading}
                {...form.register(name)}
                error={message ? t(message) : undefined}
                helpText={
                  name === 'newPasswd'
                    ? t('settings.profile.passwordLength')
                    : undefined
                }
                rightIcon={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setVisible((previous) => ({
                        ...previous,
                        [name]: !previous[name],
                      }))
                    }
                    aria-label={t(
                      visible[name]
                        ? 'settings.profile.hidePassword'
                        : 'settings.profile.showPassword',
                      { field: t(label) },
                    )}
                  >
                    {visible[name] ? (
                      <EyeOff className="size-icon-sm" />
                    ) : (
                      <Eye className="size-icon-sm" />
                    )}
                  </Button>
                }
              />
            )
          })}
          <div className="flex justify-end gap-space-sm border-t border-border-subtle pt-space-base">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={loading}>
              {t('settings.profile.savePassword')}
            </Button>
          </div>
        </form>
      </ModalContent>
    </ModalRoot>
  )
}
