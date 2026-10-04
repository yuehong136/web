import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { CoreSpace } from '@/api/skill-core-types'
import { skillCoreAPI } from '@/api/skill-core'
import { useCoreAction } from '@/hooks/use-skill-core-request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { SkillError } from '../skill-shared'

export function CoreSpaceDialog({
  space,
  onClose,
}: {
  space?: CoreSpace
  onClose: () => void
}) {
  const { t } = useTranslation()
  const action = useCoreAction()
  const form = useForm({
    defaultValues: {
      name: space?.name || '',
      description: space?.description || '',
    },
  })
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !action.isPending) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(space ? 'skills.editSpace' : 'skills.createSpace')}
          </DialogTitle>
          <DialogDescription>{t('skills.spaceDescription')}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-space-base px-space-lg"
          onSubmit={form.handleSubmit((values) =>
            action.mutate(
              () =>
                space
                  ? skillCoreAPI.updateSpace(space.id, values)
                  : skillCoreAPI.createSpace(values),
              { onSuccess: onClose },
            ),
          )}
        >
          <Input
            label={t('skills.name')}
            required
            maxLength={128}
            disabled={action.isPending}
            {...form.register('name')}
          />
          <Textarea
            aria-label={t('skills.description')}
            placeholder={t('skills.description')}
            disabled={action.isPending}
            {...form.register('description')}
          />
          <SkillError error={action.error} />
          {!space && action.error && (
            <p aria-live="polite" className="text-sm text-text-secondary">
              {t('skills.createUnknown')}
            </p>
          )}
          <DialogFooter className="-mx-space-lg">
            <Button
              type="button"
              variant="outline"
              disabled={action.isPending}
              onClick={onClose}
            >
              {t('skills.cancel')}
            </Button>
            <Button disabled={action.isPending || (!space && !!action.error)}>
              {t('skills.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
