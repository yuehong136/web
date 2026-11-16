import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderPlus, Plus } from 'lucide-react'
import { CollectionTemplate } from '@/components/page-templates'
import {
  FilterBar,
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  Pager,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { useCoreSpaces, useCoreAction } from '@/hooks/use-skill-core-request'
import { skillCoreAPI } from '@/api/skill-core'
import type { CoreSpace } from '@/api/skill-core-types'
import { SkillDeleteDialog, SkillError } from '../skill-shared'
import {
  SkillNotices,
  SkillSpaceList,
  type SkillSpaceItem,
} from '../skill-collection'
import { CoreSpaceDialog } from './core-space-dialog'
import { CoreImportDialog } from './core-import-dialog'
import { CoreDeletion, useCoreDeletionRoute } from './core-deletion'

const PAGE_SIZE = 20

/** Core protocol: the space list is loaded whole and paged here. */
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
  const items: SkillSpaceItem[] = spaces
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((space) => ({
      id: space.id,
      name: space.name,
      description: space.description,
      href: `/skills/${space.id}`,
      status:
        space.status === 'active'
          ? undefined
          : space.delete_error
            ? { label: t('skills.states.delete_failed'), tone: 'error' }
            : { label: t(`skills.states.${space.status}`) },
      onImport: () => setImporting(space),
      importDisabled: space.status !== 'active',
      onEdit: () => setEditing(space),
      editDisabled: space.status !== 'active',
      onDelete: () => setDeleting(space),
      deleteDisabled:
        space.status === 'deleting' && !space.delete_error?.retryable,
    }))
  const state = query.isLoading
    ? 'loading'
    : query.error
      ? 'error'
      : !spaces.length
        ? 'empty'
        : 'content'

  return (
    <>
      <CollectionTemplate
        title={t('skills.title')}
        count={query.data ? spaces.length : undefined}
        countLabel={t('skills.spaceResults', { count: spaces.length })}
        description={t('skills.discoverDescription')}
        actions={
          state === 'empty' && !filter ? null : (
            <Button onClick={() => setEditing('new')}>
              <Plus className="size-icon-sm" aria-hidden="true" />
              {t('skills.createSpace')}
            </Button>
          )
        }
        filterBar={
          <div className="flex flex-col gap-space-sm">
            <FilterBar
              search={{
                value: filter,
                onChange: (value) => {
                  setFilter(value)
                  setPage(1)
                },
                placeholder: t('skills.filter'),
              }}
            />
            <SkillNotices>
              {tracker.ids.map((id) => (
                <CoreDeletion
                  key={id}
                  id={id}
                  dismiss={() => tracker.dismiss(id)}
                />
              ))}
              {action.error ? <SkillError error={action.error} /> : null}
            </SkillNotices>
          </div>
        }
        state={state}
        loadingState={<PageLoadingState title={t('skills.loading')} />}
        errorState={
          <PageErrorState
            title={t('skills.error')}
            description={<SkillError error={query.error} />}
            onRetry={() => void query.refetch()}
            retryLabel={t('skills.retry')}
          />
        }
        emptyState={
          <PageEmptyState
            icon={<FolderPlus className="size-icon-lg" />}
            title={t(filter ? 'skills.noSpaceMatches' : 'skills.empty')}
            description={t(
              filter
                ? 'skills.noSpaceMatchesDescription'
                : 'skills.emptyDescription',
            )}
            action={
              filter ? (
                <Button variant="outline" onClick={() => setFilter('')}>
                  {t('skills.clearFilter')}
                </Button>
              ) : (
                <Button onClick={() => setEditing('new')}>
                  <Plus className="size-icon-sm" aria-hidden="true" />
                  {t('skills.createSpace')}
                </Button>
              )
            }
          />
        }
        footer={
          <Pager
            page={page}
            pageSize={PAGE_SIZE}
            total={spaces.length}
            onPageChange={setPage}
          />
        }
      >
        <SkillSpaceList spaces={items} />
      </CollectionTemplate>
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
