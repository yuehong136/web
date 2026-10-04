import { Label } from '@/components/ui/label'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { skillsAPI } from '@/api/skills'
import { APIError } from '@/api/client'
import type { AcceptedSkillOperation } from '@/api/skill-types'
import { useSkillAction } from '@/hooks/use-skill-request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { prepareSkillDirectory } from './skill-upload-package'
import { SkillError } from './skill-shared'

const schema = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(64),
  version: z
    .string()
    .regex(
      /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*)?(?:\+[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*)?$/,
    ),
})
export function SkillUploadDialog({
  space,
  onClose,
  onAccepted,
}: {
  space: string
  onClose: () => void
  onAccepted: (operation: AcceptedSkillOperation) => void
}) {
  const { t } = useTranslation()
  const activateId = useId()
  const [archive, setArchive] = useState(true)
  const [files, setFiles] = useState<File[]>([])
  const [activate, setActivate] = useState(false)
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID())
  const action = useSkillAction(onAccepted)
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', version: '1.0.0' },
  })
  const changed = () => {
    setRequestKey(crypto.randomUUID())
    action.reset()
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !action.isPending) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('skills.upload')}</DialogTitle>
          <DialogDescription>{t('skills.uploadDescription')}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-space-base px-space-lg"
          onChange={changed}
          onSubmit={form.handleSubmit(({ name, version }) => {
            action.mutate(
              async () => {
                if (archive) {
                  if (files.length !== 1 || files[0].size > 50 * 1024 * 1024)
                    throw new APIError(
                      422,
                      'INVALID_PACKAGE',
                      'Invalid package',
                    )
                  return skillsAPI.install(
                    space,
                    { name, version, activate },
                    files,
                    true,
                    requestKey,
                  )
                }
                const prepared = await prepareSkillDirectory(
                  files,
                  name,
                  version,
                  activate,
                )
                return skillsAPI.install(
                  space,
                  prepared.manifest,
                  prepared.files,
                  false,
                  requestKey,
                )
              },
              { onSuccess: onClose },
            )
          })}
        >
          <div className="flex gap-space-sm">
            <Button
              type="button"
              disabled={action.isPending}
              variant={archive ? 'default' : 'outline'}
              onClick={() => {
                setArchive(true)
                setFiles([])
                changed()
              }}
            >
              {t('skills.zip')}
            </Button>
            <Button
              type="button"
              disabled={action.isPending}
              variant={!archive ? 'default' : 'outline'}
              onClick={() => {
                setArchive(false)
                setFiles([])
                changed()
              }}
            >
              {t('skills.directory')}
            </Button>
          </div>
          <Input
            key={String(archive)}
            type="file"
            label={t(archive ? 'skills.zip' : 'skills.directory')}
            accept={archive ? '.zip' : undefined}
            multiple={!archive}
            {...(!archive ? { webkitdirectory: '', directory: '' } : {})}
            onChange={(event) => setFiles(Array.from(event.target.files || []))}
            required
            disabled={action.isPending}
          />
          <p className="text-sm text-text-secondary">
            {t('skills.packageRules')}
          </p>
          <Input
            disabled={action.isPending}
            label={t('skills.name')}
            {...form.register('name')}
            required
            error={
              form.formState.errors.name
                ? t('skills.errors.HTTP_422')
                : undefined
            }
          />
          <Input
            disabled={action.isPending}
            label={t('skills.version')}
            {...form.register('version')}
            required
            error={
              form.formState.errors.version
                ? t('skills.errors.HTTP_422')
                : undefined
            }
          />
          <Label
            htmlFor={activateId}
            className="flex items-center gap-space-sm text-sm"
          >
            <Checkbox
              id={activateId}
              disabled={action.isPending}
              checked={activate}
              onCheckedChange={(value) => {
                setActivate(value === true)
                changed()
              }}
            />
            {t('skills.activateOnInstall')}
          </Label>
          <SkillError error={action.error} />
          <DialogFooter className="-mx-space-lg">
            <Button
              type="button"
              disabled={action.isPending}
              variant="outline"
              onClick={onClose}
            >
              {t('skills.cancel')}
            </Button>
            <Button type="submit" disabled={action.isPending || !files.length}>
              {t('skills.install')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
