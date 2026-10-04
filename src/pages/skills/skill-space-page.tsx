import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { SkillSearchMode } from '@/api/skill-types'
import { skillsAPI } from '@/api/skills'
import {
  useSkillAction,
  useSkillCapabilities,
  useSkillSearch,
  useSkillSpace,
  useSkills,
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
import { SkillConfigDialog } from './skill-config-dialog'
import { SkillUploadDialog } from './skill-upload-dialog'
import { SkillSelect } from './skill-select'
import {
  SkillDeleteDialog,
  SkillError,
  SkillOperations,
  SkillPagination,
  useSkillOperationRoute,
} from './skill-shared'

export function SkillSpacePage() {
  const { spaceId = '' } = useParams()
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [keywords, setKeywords] = useState('')
  const [retrieving, setRetrieving] = useState(false)
  const [draft, setDraft] = useState('')
  const [queryText, setQueryText] = useState('')
  const [mode, setMode] = useState<SkillSearchMode>('keyword')
  const [submittedMode, setSubmittedMode] = useState<SkillSearchMode>('keyword')
  const [sort, setSort] = useState<'name' | 'create_time'>('create_time')
  const [desc, setDesc] = useState(true)
  const [selected, setSelected] = useState<string[]>([])
  const [dialog, setDialog] = useState<'upload' | 'config' | 'delete' | null>(
    null,
  )
  const tracker = useSkillOperationRoute()
  const action = useSkillAction(tracker.accepted)
  const space = useSkillSpace(spaceId)
  const capabilities = useSkillCapabilities()
  const assets = useSkills(spaceId, {
    page,
    page_size: 20,
    keywords,
    sort,
    desc,
  })
  const search = useSkillSearch(
    spaceId,
    queryText,
    submittedMode,
    page,
    retrieving,
  )
  const writable =
    capabilities.data?.writable &&
    space.data?.backend_owner === capabilities.data?.backend &&
    space.data?.state === 'active'
  const query = retrieving ? search : assets
  const resetPage = () => {
    setPage(1)
    setSelected([])
  }
  return (
    <>
      <ListPageTemplate
        title={space.data?.name || t('skills.title')}
        description={space.data?.description}
        headerActions={
          <>
            <Button variant="outline" asChild>
              <Link to={tracker.href('/skills')}>{t('skills.back')}</Link>
            </Button>
            <Button
              variant="outline"
              disabled={!writable}
              onClick={() => setDialog('config')}
            >
              {t('skills.configuration')}
            </Button>
            <Button
              disabled={!writable || !capabilities.data?.storage_available}
              onClick={() => setDialog('upload')}
            >
              {t('skills.upload')}
            </Button>
          </>
        }
        toolbarLeft={
          <div className="flex flex-wrap items-end gap-space-sm">
            <Button
              variant={retrieving ? 'outline' : 'default'}
              onClick={() => {
                setRetrieving(false)
                resetPage()
              }}
            >
              {t('skills.browse')}
            </Button>
            <Button
              variant={retrieving ? 'default' : 'outline'}
              onClick={() => {
                setRetrieving(true)
                resetPage()
              }}
            >
              {t('skills.retrieve')}
            </Button>
            {!retrieving && (
              <Input
                aria-label={t('skills.filter')}
                placeholder={t('skills.filter')}
                value={keywords}
                onChange={(event) => {
                  setKeywords(event.target.value)
                  resetPage()
                }}
              />
            )}
          </div>
        }
        toolbarRight={
          !retrieving && (
            <Button
              variant="outline"
              disabled={!selected.length || !writable || action.isPending}
              onClick={() => setDialog('delete')}
            >
              {t('skills.deleteSelected')} ({selected.length})
            </Button>
          )
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
          <SkillError
            error={action.error || space.error || capabilities.error}
          />
          {space.data && !writable && capabilities.data && (
            <p className="text-sm text-status-warning">
              {t(
                capabilities.data?.writable === false
                  ? 'skills.readOnly'
                  : 'skills.ownerMismatch',
              )}
            </p>
          )}
          {capabilities.data && !capabilities.data.storage_available && (
            <p className="text-sm text-status-warning">
              {t('skills.noStorage')}
            </p>
          )}
          {retrieving &&
            capabilities.data &&
            !capabilities.data.search_available && (
              <p className="text-sm text-status-warning">
                {t('skills.noSearch')}
              </p>
            )}
          {retrieving ? (
            <form
              className="flex flex-wrap items-end gap-space-sm"
              onSubmit={(event) => {
                event.preventDefault()
                setQueryText(draft)
                setSubmittedMode(mode)
                resetPage()
                if (draft === queryText && mode === submittedMode)
                  void search.refetch()
              }}
            >
              <div className="min-w-0 flex-1">
                <Input
                  label={t('skills.query')}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
              </div>
              <details>
                <summary className="cursor-pointer py-space-sm text-sm">
                  {t('skills.advanced')}
                </summary>
                <SkillSelect
                  label={t('skills.search')}
                  value={mode}
                  options={Array.from(
                    new Set([
                      'keyword',
                      ...(capabilities.data?.search_modes || []),
                    ]),
                  ).map((value) => ({
                    value,
                    label: t(`skills.${value}`),
                    disabled: !draft.trim() && value !== 'keyword',
                  }))}
                  onChange={(value) => {
                    setMode(value as SkillSearchMode)
                    resetPage()
                  }}
                />
              </details>
              <Button
                type="submit"
                disabled={
                  (!draft.trim() && mode !== 'keyword') ||
                  (Boolean(draft.trim()) &&
                    !capabilities.data?.search_available) ||
                  search.isFetching
                }
              >
                {t('skills.search')}
              </Button>
            </form>
          ) : (
            <div className="flex gap-space-sm">
              <SkillSelect
                label={t('skills.field')}
                value={sort}
                options={[
                  { value: 'name', label: t('skills.sortName') },
                  { value: 'create_time', label: t('skills.sortCreated') },
                ]}
                onChange={(value) => {
                  setSort(value as typeof sort)
                  resetPage()
                }}
              />
              <Button
                variant="ghost"
                onClick={() => {
                  setDesc(!desc)
                  resetPage()
                }}
              >
                {t(desc ? 'skills.descending' : 'skills.ascending')}
              </Button>
            </div>
          )}
          {query.isLoading ? (
            <PageLoadingState title={t('skills.loading')} description="" />
          ) : query.error ? (
            <PageErrorState
              title={t('skills.error')}
              description={<SkillError error={query.error} />}
              onRetry={() => void query.refetch()}
              retryLabel={t('skills.retry')}
            />
          ) : !query.data?.skills.length ? (
            <PageEmptyState
              title={t('skills.empty')}
              description={t('skills.emptyDescription')}
            />
          ) : retrieving ? (
            <>
              <p className="text-sm text-text-secondary">
                {t(
                  search.data?.total_relation === 'gte'
                    ? 'skills.lowerBound'
                    : 'skills.resultCount',
                  { total: search.data?.total },
                )}
              </p>
              {search.data?.skills.map((skill) => (
                <article
                  className="rounded-radius-lg border border-border-default bg-background-surface p-space-base"
                  key={`${skill.skill_id}/${skill.version_id}`}
                >
                  <Link
                    className="font-semibold hover:underline"
                    to={tracker.href(
                      `/skills/${spaceId}/skills/${skill.skill_id}`,
                      { version: skill.version_id },
                    )}
                  >
                    {skill.name} · {skill.version}
                  </Link>
                  <p className="text-sm text-text-secondary">
                    {skill.description}
                  </p>
                  <p className="text-sm">
                    {t('skills.score', { score: skill.score.toFixed(3) })}
                  </p>
                </article>
              ))}
            </>
          ) : (
            assets.data?.skills.map((skill) => (
              <article
                key={skill.id}
                className="flex items-start gap-space-base rounded-radius-lg border border-border-default bg-background-surface p-space-base"
              >
                <Checkbox
                  aria-label={t('skills.select', { name: skill.name })}
                  checked={selected.includes(skill.id)}
                  disabled={!writable}
                  onCheckedChange={(value) =>
                    setSelected((ids) =>
                      value
                        ? [...ids, skill.id]
                        : ids.filter((id) => id !== skill.id),
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <Link
                    className="font-semibold hover:underline"
                    to={tracker.href(`/skills/${spaceId}/skills/${skill.id}`)}
                  >
                    {skill.name}
                  </Link>
                  <p className="text-sm text-text-secondary">
                    {skill.description}
                  </p>
                  <p className="text-sm">
                    {t(
                      skill.active_version_id
                        ? 'skills.active'
                        : 'skills.noActive',
                    )}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </ListPageTemplate>
      {dialog === 'upload' && (
        <SkillUploadDialog
          space={spaceId}
          onClose={() => setDialog(null)}
          onAccepted={tracker.accepted}
        />
      )}
      {dialog === 'config' && (
        <SkillConfigDialog
          space={spaceId}
          onClose={() => setDialog(null)}
          onAccepted={tracker.accepted}
        />
      )}
      <SkillDeleteDialog
        open={dialog === 'delete'}
        pending={action.isPending}
        onClose={() => setDialog(null)}
        onConfirm={() => {
          const key = action.requestKey(
            `delete/${spaceId}/${[...selected].sort().join(',')}`,
          )
          action.mutate(() => skillsAPI.uninstall(spaceId, selected, key), {
            onSuccess: () => {
              setDialog(null)
              setSelected([])
            },
          })
        }}
      />
    </>
  )
}
