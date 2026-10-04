import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useCoreAction } from '@/hooks/use-skill-core-request'
import { skillCoreAPI } from '@/api/skill-core'
import { APIError } from '@/api/client'
import type { CoreSpace } from '@/api/skill-core-types'
import { SkillError } from '../skill-shared'
import {
  createCoreVersion,
  prepareCoreDirectory,
  uploadCoreDirectory,
} from './core-import'

export function CoreImportDialog({
  space,
  onClose,
}: {
  space: CoreSpace
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [files, setFiles] = useState<File[]>([])
  const [saved, setSaved] = useState(0)
  const [folder, setFolder] = useState<string | null>(null)
  const [complete, setComplete] = useState(false)
  const [indexed, setIndexed] = useState(false)
  const action = useCoreAction()
  const form = useForm({ defaultValues: { name: '', version: '1.0.0' } })
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !action.isPending) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('skills.import')}</DialogTitle>
          <DialogDescription>
            {t('skills.core.importDescription')}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-space-base px-space-lg"
          onSubmit={form.handleSubmit(({ name, version }) => {
            action.mutate(async () => {
              const entries = prepareCoreDirectory(files)
              if (!entries.some((file) => file.path === 'SKILL.md'))
                throw new APIError(422, 'INVALID_PACKAGE', 'Missing SKILL.md')
              const created = await createCoreVersion(
                space.folder_id,
                name,
                version,
              )
              setFolder(created.skill.id)
              await uploadCoreDirectory(created.folder.id, entries, setSaved)
              setComplete(true)
            })
          })}
        >
          {!folder && (
            <>
              <Input
                type="file"
                label={t('skills.directory')}
                multiple
                {...{ webkitdirectory: '', directory: '' }}
                disabled={action.isPending}
                onChange={(event) =>
                  setFiles(Array.from(event.target.files || []))
                }
                required
              />
              <Input
                label={t('skills.name')}
                required
                maxLength={255}
                disabled={action.isPending}
                {...form.register('name')}
              />
              <Input
                label={t('skills.version')}
                required
                maxLength={255}
                disabled={action.isPending}
                {...form.register('version')}
              />
              {!!files.length && (
                <details>
                  <summary>
                    {t('skills.previewPackage', { count: files.length })}
                  </summary>
                  <ul className="max-h-48 overflow-auto text-sm text-text-secondary">
                    {files.slice(0, 100).map((file) => (
                      <li key={file.webkitRelativePath || file.name}>
                        {file.webkitRelativePath || file.name}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
          {folder && (
            <div
              aria-live="polite"
              className="flex flex-col gap-space-sm rounded-radius-lg bg-background-subtle p-space-base"
            >
              <p>
                {t(
                  complete
                    ? 'skills.core.filesSaved'
                    : 'skills.core.partialFiles',
                  { count: saved, total: files.length },
                )}
              </p>
              <p
                className={
                  indexed ? 'text-status-success' : 'text-text-secondary'
                }
              >
                {t(
                  indexed
                    ? 'skills.core.indexReady'
                    : 'skills.core.indexPending',
                )}
              </p>
              <Link
                to={`/skills/${space.id}/skills/${folder}`}
                className="underline"
              >
                {t('skills.core.inspectFiles')}
              </Link>
            </div>
          )}
          <SkillError error={action.error} />
          <DialogFooter className="-mx-space-lg">
            <Button
              type="button"
              variant="outline"
              disabled={action.isPending}
              onClick={onClose}
            >
              {t(folder ? 'skills.close' : 'skills.cancel')}
            </Button>
            {!folder ? (
              <Button
                type="submit"
                disabled={!files.length || action.isPending}
              >
                {t('skills.import')}
              </Button>
            ) : (
              complete &&
              !indexed && (
                <Button
                  type="button"
                  disabled={action.isPending}
                  onClick={() =>
                    action.mutate(async () => {
                      const result = await skillCoreAPI.reindex(space.id)
                      if (result.failed_count)
                        throw new APIError(
                          200,
                          'CORE_INDEX_PARTIAL',
                          'Index incomplete',
                        )
                      setIndexed(true)
                    })
                  }
                >
                  {t(action.error ? 'skills.retryIndex' : 'skills.reindex')}
                </Button>
              )
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
