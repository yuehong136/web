import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FolderPlus, Plus, Trash2 } from 'lucide-react'
import type { SkillSpace } from '@/api/skill-types'
import { skillsAPI } from '@/api/skills'
import {
  useSkillAction,
  useSkillCapabilities,
  useSkillSpaces,
} from '@/hooks/use-skill-request'
import { CollectionTemplate } from '@/components/page-templates'
import {
  BulkActionBar,
  FilterBar,
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  Pager,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { SkillSpaceDialog } from './skill-space-dialog'
import { SkillUploadDialog } from './skill-upload-dialog'
import {
  SkillNotices,
  SkillSpaceList,
  pageSelection,
  type SkillSpaceItem,
} from './skill-collection'
import {
  SkillDeleteDialog,
  SkillError,
  SkillOperations,
  useSkillOperationRoute,
} from './skill-shared'

const PAGE_SIZE = 20

export function SkillSpacesPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [keywords, setKeywords] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<SkillSpace | 'new' | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [importing, setImporting] = useState<SkillSpace | null>(null)
  const tracker = useSkillOperationRoute()
  const action = useSkillAction(tracker.accepted)
  const query = useSkillSpaces({ page, page_size: PAGE_SIZE, keywords })
  const capabilities = useSkillCapabilities()
  const writable = (space: SkillSpace) =>
    Boolean(
      capabilities.data?.writable &&
      capabilities.data?.backend === space.backend_owner &&
      space.state === 'active',
    )
  const spaces = query.data?.spaces ?? []
  const total = query.data?.total ?? 0
  const items: SkillSpaceItem[] = spaces.map((space) => ({
    id: space.id,
    name: space.name,
    description: space.description,
    href: tracker.href(`/skills/${space.id}`),
    status:
      space.state === 'active'
        ? undefined
        : {
            label: t(`skills.states.${space.state}`),
            tone: space.state.endsWith('failed') ? 'error' : 'default',
          },
    note:
      !writable(space) && capabilities.data
        ? t(
            capabilities.data.writable === false
              ? 'skills.readOnly'
              : 'skills.ownerMismatch',
          )
        : undefined,
    selection: {
      checked: selected.includes(space.id),
      disabled: !writable(space),
      label: t('skills.select', { name: space.name }),
      onCheckedChange: (checked) =>
        setSelected((value) =>
          checked
            ? [...value, space.id]
            : value.filter((id) => id !== space.id),
        ),
    },
    onImport: () => setImporting(space),
    importDisabled: !writable(space) || !capabilities.data?.storage_available,
    onEdit: () => setEditing(space),
    editDisabled: !writable(space),
  }))
  const changePage = (value: number) => {
    setPage(value)
    setSelected([])
  }
  const state = query.isLoading
    ? 'loading'
    : query.error
      ? 'error'
      : !spaces.length
        ? 'empty'
        : 'content'
  const canCreate = Boolean(capabilities.data?.writable)

  return (
    <>
      <CollectionTemplate
        title={t('skills.title')}
        count={query.data ? total : undefined}
        countLabel={t('skills.spaceResults', { count: total })}
        description={t('skills.discoverDescription')}
        actions={
          state === 'empty' && !keywords ? null : (
            <Button disabled={!canCreate} onClick={() => setEditing('new')}>
              <Plus className="size-icon-sm" aria-hidden="true" />
              {t('skills.createSpace')}
            </Button>
          )
        }
        filterBar={
          <div className="flex flex-col gap-space-sm">
            <FilterBar
              search={{
                value: keywords,
                onChange: (value) => {
                  setKeywords(value)
                  changePage(1)
                },
                placeholder: t('skills.filter'),
              }}
            />
            <SkillNotices>
              {tracker.ids.length ? (
                <SkillOperations tracker={tracker} />
              ) : null}
              {action.error || capabilities.error ? (
                <SkillError error={action.error || capabilities.error} />
              ) : null}
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
            title={t(keywords ? 'skills.noSpaceMatches' : 'skills.empty')}
            description={t(
              keywords
                ? 'skills.noSpaceMatchesDescription'
                : 'skills.emptyDescription',
            )}
            action={
              keywords ? (
                <Button variant="outline" onClick={() => setKeywords('')}>
                  {t('skills.clearFilter')}
                </Button>
              ) : (
                <Button disabled={!canCreate} onClick={() => setEditing('new')}>
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
            total={total}
            onPageChange={changePage}
          />
        }
        bulkActions={
          selected.length ? (
            <BulkActionBar
              count={selected.length}
              onClear={() => setSelected([])}
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-danger-fg"
                disabled={action.isPending}
                onClick={() => setDeleting(true)}
              >
                <Trash2 className="size-icon-sm" aria-hidden="true" />
                {t('skills.delete')}
              </Button>
            </BulkActionBar>
          ) : null
        }
      >
        <SkillSpaceList
          spaces={items}
          selectAll={pageSelection(
            spaces.filter(writable).map((space) => space.id),
            selected,
            setSelected,
          )}
        />
      </CollectionTemplate>
      {editing && (
        <SkillSpaceDialog
          space={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {importing && (
        <SkillUploadDialog
          space={importing.id}
          onClose={() => setImporting(null)}
          onAccepted={tracker.accepted}
        />
      )}
      <SkillDeleteDialog
        open={deleting}
        pending={action.isPending}
        onClose={() => setDeleting(false)}
        onConfirm={() => {
          const key = action.requestKey(
            `delete/${[...selected].sort().join(',')}`,
          )
          action.mutate(() => skillsAPI.deleteSpaces(selected, key), {
            onSuccess: () => {
              setDeleting(false)
              setSelected([])
            },
          })
        }}
      />
    </>
  )
}
