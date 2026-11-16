import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PackagePlus, Search, Settings2, Trash2, Upload } from 'lucide-react'
import type { SkillSearchMode } from '@/api/skill-types'
import { skillsAPI } from '@/api/skills'
import {
  useSkillAction,
  useSkillCapabilities,
  useSkillSearch,
  useSkillSpace,
  useSkills,
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
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SkillConfigDialog } from './skill-config-dialog'
import { SkillUploadDialog } from './skill-upload-dialog'
import {
  SkillAssetList,
  SkillNotices,
  pageSelection,
  type SkillAssetItem,
} from './skill-collection'
import { SkillSearchForm } from './skill-search-form'
import {
  SkillDeleteDialog,
  SkillError,
  SkillOperations,
  useSkillOperationRoute,
} from './skill-shared'

const PAGE_SIZE = 20
type Mode = 'browse' | 'retrieve'

export function SkillSpacePage() {
  const { spaceId = '' } = useParams()
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [keywords, setKeywords] = useState('')
  const [mode, setMode] = useState<Mode>('browse')
  const [draft, setDraft] = useState('')
  const [queryText, setQueryText] = useState('')
  const [searchMode, setSearchMode] = useState<SkillSearchMode>('keyword')
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
  const retrieving = mode === 'retrieve'
  const assets = useSkills(spaceId, {
    page,
    page_size: PAGE_SIZE,
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
  const writable = Boolean(
    capabilities.data?.writable &&
    space.data?.backend_owner === capabilities.data?.backend &&
    space.data?.state === 'active',
  )
  const query = retrieving ? search : assets
  const total = query.data?.total ?? 0
  const resetPage = () => {
    setPage(1)
    setSelected([])
  }

  const items: SkillAssetItem[] = retrieving
    ? (search.data?.skills ?? []).map((skill) => ({
        key: `${skill.skill_id}/${skill.version_id}`,
        name: `${skill.name} · ${skill.version}`,
        description: skill.description,
        href: tracker.href(`/skills/${spaceId}/skills/${skill.skill_id}`, {
          version: skill.version_id,
        }),
        meta: t('skills.score', { score: skill.score.toFixed(3) }),
      }))
    : (assets.data?.skills ?? []).map((skill) => ({
        key: skill.id,
        name: skill.name,
        description: skill.description,
        href: tracker.href(`/skills/${spaceId}/skills/${skill.id}`),
        status: skill.active_version_id
          ? { label: t('skills.active') }
          : { label: t('skills.noActive'), tone: 'warning' },
        meta: skill.tags.length ? skill.tags.join(' · ') : undefined,
        selection: {
          checked: selected.includes(skill.id),
          disabled: !writable,
          label: t('skills.select', { name: skill.name }),
          onCheckedChange: (checked) =>
            setSelected((ids) =>
              checked
                ? [...ids, skill.id]
                : ids.filter((id) => id !== skill.id),
            ),
        },
      }))
  const state = query.isLoading
    ? 'loading'
    : query.error
      ? 'error'
      : !items.length
        ? 'empty'
        : 'content'
  const canUpload = writable && Boolean(capabilities.data?.storage_available)

  return (
    <>
      <CollectionTemplate
        title={space.data?.name || t('skills.title')}
        crumbs={[{ label: t('skills.title'), to: tracker.href('/skills') }]}
        count={query.data ? total : undefined}
        countLabel={t('skills.skillResults', { count: total })}
        description={space.data?.description || undefined}
        actions={
          <>
            <Button
              variant="ghost"
              disabled={!writable}
              onClick={() => setDialog('config')}
            >
              <Settings2 className="size-icon-sm" aria-hidden="true" />
              {t('skills.configuration')}
            </Button>
            {state === 'empty' && !retrieving && !keywords ? null : (
              <Button disabled={!canUpload} onClick={() => setDialog('upload')}>
                <Upload className="size-icon-sm" aria-hidden="true" />
                {t('skills.upload')}
              </Button>
            )}
          </>
        }
        filterBar={
          <div className="flex flex-col gap-space-sm">
            <div className="flex min-w-0 flex-wrap items-center gap-space-sm">
              <SegmentedControl
                aria-label={t('skills.mode')}
                size="sm"
                value={mode}
                onValueChange={(value) => {
                  setMode(value)
                  resetPage()
                }}
                options={[
                  { value: 'browse', label: t('skills.browse') },
                  { value: 'retrieve', label: t('skills.retrieve') },
                ]}
              />
              {retrieving ? (
                <SkillSearchForm
                  className="min-w-0 flex-1"
                  draft={draft}
                  onDraftChange={setDraft}
                  mode={searchMode}
                  modes={Array.from(
                    new Set([
                      'keyword' as SkillSearchMode,
                      ...(capabilities.data?.search_modes || []),
                    ]),
                  )}
                  onModeChange={(value) => {
                    setSearchMode(value)
                    resetPage()
                  }}
                  submitDisabled={
                    (!draft.trim() && searchMode !== 'keyword') ||
                    (Boolean(draft.trim()) &&
                      !capabilities.data?.search_available) ||
                    search.isFetching
                  }
                  onSubmit={() => {
                    setQueryText(draft)
                    setSubmittedMode(searchMode)
                    resetPage()
                    if (draft === queryText && searchMode === submittedMode)
                      void search.refetch()
                  }}
                />
              ) : (
                <FilterBar
                  className="min-w-0 flex-1"
                  search={{
                    value: keywords,
                    onChange: (value) => {
                      setKeywords(value)
                      resetPage()
                    },
                    placeholder: t('skills.filter'),
                  }}
                  sort={{
                    label: t('skills.field'),
                    value: sort,
                    onChange: (value) => {
                      setSort(value as typeof sort)
                      resetPage()
                    },
                    options: [
                      { value: 'name', label: t('skills.sortName') },
                      { value: 'create_time', label: t('skills.sortCreated') },
                    ],
                  }}
                  display={[
                    {
                      key: 'order',
                      label: t('skills.order'),
                      value: desc ? 'desc' : 'asc',
                      onChange: (value) => {
                        setDesc(value === 'desc')
                        resetPage()
                      },
                      options: [
                        { value: 'desc', label: t('skills.descending') },
                        { value: 'asc', label: t('skills.ascending') },
                      ],
                    },
                  ]}
                />
              )}
            </div>
            <SkillNotices>
              {tracker.ids.length ? (
                <SkillOperations tracker={tracker} />
              ) : null}
              {action.error || space.error || capabilities.error ? (
                <SkillError
                  error={action.error || space.error || capabilities.error}
                />
              ) : null}
              {space.data && !writable && capabilities.data ? (
                <p className="text-sm text-status-warning">
                  {t(
                    capabilities.data.writable === false
                      ? 'skills.readOnly'
                      : 'skills.ownerMismatch',
                  )}
                </p>
              ) : null}
              {capabilities.data && !capabilities.data.storage_available ? (
                <p className="text-sm text-status-warning">
                  {t('skills.noStorage')}
                </p>
              ) : null}
              {retrieving &&
              capabilities.data &&
              !capabilities.data.search_available ? (
                <p className="text-sm text-status-warning">
                  {t('skills.noSearch')}
                </p>
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
          retrieving || keywords ? (
            <PageEmptyState
              icon={<Search className="size-icon-lg" />}
              title={t('skills.empty')}
              description={t('skills.noMatches')}
            />
          ) : (
            <PageEmptyState
              icon={<PackagePlus className="size-icon-lg" />}
              title={t('skills.empty')}
              description={t('skills.emptyDescription')}
              action={
                <Button
                  disabled={!canUpload}
                  onClick={() => setDialog('upload')}
                >
                  <Upload className="size-icon-sm" aria-hidden="true" />
                  {t('skills.upload')}
                </Button>
              }
            />
          )
        }
        footerNote={
          retrieving && search.data
            ? t(
                search.data.total_relation === 'gte'
                  ? 'skills.lowerBound'
                  : 'skills.resultCount',
                { total: search.data.total },
              )
            : undefined
        }
        footer={
          <Pager
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={(value) => {
              setPage(value)
              setSelected([])
            }}
          />
        }
        bulkActions={
          !retrieving && selected.length ? (
            <BulkActionBar
              count={selected.length}
              onClear={() => setSelected([])}
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-status-error"
                disabled={!writable || action.isPending}
                onClick={() => setDialog('delete')}
              >
                <Trash2 className="size-icon-sm" aria-hidden="true" />
                {t('skills.uninstall')}
              </Button>
            </BulkActionBar>
          ) : null
        }
      >
        <SkillAssetList
          skills={items}
          metaLabel={retrieving ? t('skills.scoreColumn') : t('skills.tags')}
          selectAll={
            retrieving || !writable
              ? undefined
              : pageSelection(
                  (assets.data?.skills ?? []).map((skill) => skill.id),
                  selected,
                  setSelected,
                )
          }
        />
      </CollectionTemplate>
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
