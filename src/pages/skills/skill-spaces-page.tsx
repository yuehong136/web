import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Folder, Plus } from 'lucide-react'
import type { SkillSpace } from '@/api/skill-types'
import { skillsAPI } from '@/api/skills'
import {
  useSkillAction,
  useSkillCapabilities,
  useSkillSpaces,
} from '@/hooks/use-skill-request'
import { ListPageTemplate } from '@/components/page-templates'
import {
  PageLoadingState,
  PageEmptyState,
  PageErrorState,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { SkillSpaceDialog } from './skill-space-dialog'
import { SkillUploadDialog } from './skill-upload-dialog'
import {
  SkillDeleteDialog,
  SkillError,
  SkillOperations,
  SkillPagination,
  useSkillOperationRoute,
} from './skill-shared'

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
  const query = useSkillSpaces({ page, page_size: 20, keywords })
  const capabilities = useSkillCapabilities()
  const writable = (space: SkillSpace) =>
    capabilities.data?.writable &&
    capabilities.data?.backend === space.backend_owner &&
    space.state === 'active'
  return (
    <>
      <ListPageTemplate
        title={t('skills.title')}
        description={t('skills.discoverDescription')}
        headerActions={
          <Button
            disabled={!capabilities.data?.writable}
            onClick={() => setEditing('new')}
          >
            <Plus className="size-icon-sm" />
            {t('skills.createSpace')}
          </Button>
        }
        toolbarLeft={
          <Input
            aria-label={t('skills.filter')}
            placeholder={t('skills.filter')}
            value={keywords}
            onChange={(event) => {
              setKeywords(event.target.value)
              setPage(1)
              setSelected([])
            }}
          />
        }
        toolbarRight={
          <Button
            variant="outline"
            disabled={!selected.length || action.isPending}
            onClick={() => setDeleting(true)}
          >
            {t('skills.deleteSelected')} ({selected.length})
          </Button>
        }
        pagination={
          <SkillPagination
            page={page}
            total={query.data?.total || 0}
            setPage={(value) => {
              setPage(value)
              setSelected([])
            }}
          />
        }
      >
        <div className="flex flex-col gap-space-base">
          <SkillOperations tracker={tracker} />
          <SkillError error={action.error || capabilities.error} />
          {query.isLoading ? (
            <PageLoadingState title={t('skills.loading')} description="" />
          ) : query.error ? (
            <PageErrorState
              title={t('skills.error')}
              description={<SkillError error={query.error} />}
              onRetry={() => void query.refetch()}
              retryLabel={t('skills.retry')}
            />
          ) : !query.data?.spaces.length ? (
            <PageEmptyState
              title={t('skills.empty')}
              description={t('skills.emptyDescription')}
            />
          ) : (
            <div className="grid gap-space-base md:grid-cols-2 xl:grid-cols-3">
              {query.data.spaces.map((space) => (
                <article
                  key={space.id}
                  className="rounded-radius-lg border border-border-default bg-background-surface p-space-lg"
                >
                  <div className="flex items-center gap-space-sm">
                    <Checkbox
                      aria-label={t('skills.select', { name: space.name })}
                      checked={selected.includes(space.id)}
                      disabled={!writable(space)}
                      onCheckedChange={(checked) =>
                        setSelected((value) =>
                          checked
                            ? [...value, space.id]
                            : value.filter((id) => id !== space.id),
                        )
                      }
                    />
                    <Folder className="size-icon-md text-text-secondary" />
                    <Link
                      className="min-w-0 flex-1 truncate font-semibold text-text-primary hover:underline"
                      to={tracker.href(`/skills/${space.id}`)}
                    >
                      {space.name}
                    </Link>
                  </div>
                  <p className="my-space-base line-clamp-3 text-sm text-text-secondary">
                    {space.description}
                  </p>
                  <div className="flex items-center justify-between gap-space-sm">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        !writable(space) ||
                        !capabilities.data?.storage_available
                      }
                      onClick={() => setImporting(space)}
                    >
                      {t('skills.import')}
                    </Button>
                    <span className="text-sm text-text-secondary">
                      {t(`skills.states.${space.state}`)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!writable(space)}
                      onClick={() => setEditing(space)}
                    >
                      {t('skills.editSpace')}
                    </Button>
                  </div>
                  {!writable(space) && capabilities.data && (
                    <p className="text-sm text-text-secondary">
                      {t(
                        capabilities.data?.writable === false
                          ? 'skills.readOnly'
                          : 'skills.ownerMismatch',
                      )}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </ListPageTemplate>
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
