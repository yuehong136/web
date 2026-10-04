import { Label } from '@/components/ui/label'
import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { skillsAPI } from '@/api/skills'
import { APIError } from '@/api/client'
import type { SkillSpace } from '@/api/skill-types'
import { useSkillAction } from '@/hooks/use-skill-request'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { SkillError } from './skill-shared'

const schema = z.object({
  name: z.string().trim().min(1).max(128),
  description: z.string(),
})
export function SkillSpaceDialog({
  space,
  onClose,
}: {
  space?: SkillSpace
  onClose: () => void
}) {
  const { t } = useTranslation()
  const descriptionId = useId()
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: space?.name || '',
      description: space?.description || '',
    },
  })
  const action = useSkillAction()
  const unknownCreation =
    !space &&
    !!action.error &&
    (!(action.error instanceof APIError) ||
      action.error.status < 400 ||
      action.error.status === 408 ||
      action.error.status >= 500)
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
          <DialogDescription>{t('skills.subtitle')}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit((data) =>
            action.mutate(
              () =>
                space
                  ? skillsAPI.updateSpace(space.id, {
                      ...data,
                      revision: space.revision,
                    })
                  : skillsAPI.createSpace(data),
              { onSuccess: onClose },
            ),
          )}
          className="flex flex-col gap-space-base px-space-lg"
        >
          <Input
            disabled={action.isPending || unknownCreation}
            label={t('skills.name')}
            {...form.register('name')}
            required
            error={
              form.formState.errors.name
                ? t('skills.errors.HTTP_422')
                : undefined
            }
          />
          <Label htmlFor={descriptionId} className="text-sm">
            {t('skills.description')}
            <Textarea
              disabled={action.isPending || unknownCreation}
              id={descriptionId}
              {...form.register('description')}
            />
          </Label>
          <SkillError error={action.error} />
          {unknownCreation && (
            <output className="text-sm text-status-warning">
              {t('skills.createUnknown')}
            </output>
          )}
          <DialogFooter className="-mx-space-lg">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={action.isPending}
            >
              {t('skills.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={action.isPending || unknownCreation}
            >
              {t('skills.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
