import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Folder, Plus, ArrowUpRight } from 'lucide-react'
import { ListPageTemplate } from '@/components/page-templates'
import {
  PageLoadingState,
  PageEmptyState,
  PageErrorState,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCoreSpaces, useCoreAction } from '@/hooks/use-skill-core-request'
import { skillCoreAPI } from '@/api/skill-core'
import type { CoreSpace } from '@/api/skill-core-types'
import { SkillDeleteDialog, SkillError, SkillPagination } from '../skill-shared'
import { CoreSpaceDialog } from './core-space-dialog'
import { CoreImportDialog } from './core-import-dialog'
import { CoreDeletion, useCoreDeletionRoute } from './core-deletion'

export function CoreSpacesPage() {
  const { t } = useTranslation()
  const query = useCoreSpaces()
  const action = useCoreAction()
  const tracker = useCoreDeletionRoute()
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState<CoreSpace | 'new' | null>(null)
  const [importing, setImporting] = useState<CoreSpace | null>(null)
  const [deleting, setDeleting] = useState<CoreSpace | null>(null)
  const spaces =
    query.data?.spaces.filter((space) =>
      space.name.toLocaleLowerCase().includes(filter.toLocaleLowerCase()),
    ) || []
  return (
    <>
      <ListPageTemplate
        title={t('skills.title')}
        description={t('skills.discoverDescription')}
        headerActions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-icon-sm" />
            {t('skills.createSpace')}
          </Button>
        }
        toolbarLeft={
          <Input
            aria-label={t('skills.filter')}
            placeholder={t('skills.filter')}
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value)
              setPage(1)
            }}
          />
        }
        pagination={
          <SkillPagination
            page={page}
            total={spaces.length}
            setPage={setPage}
          />
        }
      >
        <div className="flex flex-col gap-space-base">
          {tracker.ids.map((id) => (
            <CoreDeletion
              key={id}
              id={id}
              dismiss={() => tracker.dismiss(id)}
            />
          ))}
          <SkillError error={action.error} />
          {query.isLoading ? (
            <PageLoadingState title={t('skills.loading')} description="" />
          ) : query.error ? (
            <PageErrorState
              title={t('skills.error')}
              description={<SkillError error={query.error} />}
              onRetry={() => void query.refetch()}
              retryLabel={t('skills.retry')}
            />
          ) : !spaces.length ? (
            <PageEmptyState
              title={t('skills.empty')}
              description={t('skills.emptyDescription')}
            />
          ) : (
            <div className="grid gap-space-base md:grid-cols-2 xl:grid-cols-3">
              {spaces.slice((page - 1) * 20, page * 20).map((space) => (
                <article
                  key={space.id}
                  className="flex flex-col gap-space-base rounded-radius-lg border border-border-default bg-background-surface p-space-lg"
                >
                  <Link
                    to={`/skills/${space.id}`}
                    className="flex items-center gap-space-sm font-semibold text-text-primary hover:underline"
                  >
                    <Folder className="size-icon-md text-text-secondary" />
                    <span className="min-w-0 flex-1 truncate">
                      {space.name}
                    </span>
                    <ArrowUpRight className="size-icon-sm" />
                  </Link>
                  <p className="line-clamp-3 flex-1 text-sm text-text-secondary">
                    {space.description || t('skills.spaceDescription')}
                  </p>
                  {space.status !== 'active' && (
                    <p>
                      {t(
                        `skills.states.${space.delete_error ? 'delete_failed' : space.status}`,
                      )}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-space-sm">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={space.status !== 'active'}
                      onClick={() => setImporting(space)}
                    >
                      {t('skills.import')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={space.status !== 'active'}
                      onClick={() => setEditing(space)}
                    >
                      {t('skills.editSpace')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={
                        space.status === 'deleting' &&
                        !space.delete_error?.retryable
                      }
                      onClick={() => setDeleting(space)}
                    >
                      {t('skills.delete')}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </ListPageTemplate>
      {editing && (
        <CoreSpaceDialog
          space={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {importing && (
        <CoreImportDialog
          space={importing}
          onClose={() => setImporting(null)}
        />
      )}
      <SkillDeleteDialog
        open={!!deleting}
        pending={action.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting)
            action.mutate(() => skillCoreAPI.deleteSpace(deleting.id), {
              onSuccess: () => {
                tracker.accepted(deleting.id)
                setDeleting(null)
              },
            })
        }}
      />
    </>
  )
}
