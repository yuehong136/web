import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PackagePlus, Pencil, Search, Settings2, Upload } from 'lucide-react'
import { CollectionTemplate } from '@/components/page-templates'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  Pager,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import {
  useCoreSpace,
  useCoreSearch,
  useCoreChildren,
} from '@/hooks/use-skill-core-request'
import { SkillError } from '../skill-shared'
import {
  SkillAssetList,
  SkillNotices,
  type SkillAssetItem,
} from '../skill-collection'
import { SkillSearchForm } from '../skill-search-form'
import { CoreConfigDialog } from './core-config-dialog'
import { CoreImportDialog } from './core-import-dialog'
import { CoreSpaceDialog } from './core-space-dialog'

const PAGE_SIZE = 20

/**
 * Core protocol adapter: browsing lists the space's skill folders (no index
 * needed), searching uses the indexed search. Both become `SkillAssetItem`s.
 */
export function CoreSpacePage() {
  const { spaceId = '' } = useParams()
  const { t } = useTranslation()
  const space = useCoreSpace(spaceId)
  const [draft, setDraft] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<'import' | 'config' | 'edit' | null>(
    null,
  )
  const search = useCoreSearch(spaceId, query, page)
  const folders = useCoreChildren(space.data?.folder_id || '')
  const browse = (folders.data || []).filter((file) => file.type === 'folder')
  const listing = query
    ? search
    : {
        isLoading: folders.isLoading,
        error: folders.error,
        refetch: folders.refetch,
        data: {
          total: browse.length,
          skills: browse
            .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
            .map((file) => ({
              folder_id: file.id,
              name: file.name,
              description: '',
              version: undefined,
              tags: [] as string[],
            })),
        },
      }
  const total = listing.data?.total ?? 0
  const items: SkillAssetItem[] = (listing.data?.skills ?? []).map((skill) => ({
    key: skill.folder_id,
    name: skill.name,
    description: skill.description || t('skills.core.readDescription'),
    href: `/skills/${spaceId}/skills/${encodeURIComponent(skill.folder_id)}`,
    status: { label: t('skills.localSource') },
    meta:
      [skill.version, ...(skill.tags ?? [])].filter(Boolean).join(' · ') ||
      undefined,
  }))
  const active = space.data?.status === 'active'
  const state = listing.isLoading
    ? 'loading'
    : listing.error
      ? 'error'
      : !items.length
        ? 'empty'
        : 'content'

  return (
    <>
      <CollectionTemplate
        title={space.data?.name || t('skills.title')}
        crumbs={[{ label: t('skills.title'), to: '/skills' }]}
        count={listing.data ? total : undefined}
        countLabel={t('skills.skillResults', { count: total })}
        description={space.data?.description || t('skills.discoverDescription')}
        actions={
          <>
            <Button
              variant="ghost"
              disabled={!space.data}
              onClick={() => setDialog('edit')}
            >
              <Pencil className="size-icon-sm" aria-hidden="true" />
              {t('skills.editSpace')}
            </Button>
            <Button
              variant="ghost"
              disabled={!space.data}
              onClick={() => setDialog('config')}
            >
              <Settings2 className="size-icon-sm" aria-hidden="true" />
              {t('skills.configuration')}
            </Button>
            {state === 'empty' && !query ? null : (
              <Button disabled={!active} onClick={() => setDialog('import')}>
                <Upload className="size-icon-sm" aria-hidden="true" />
                {t('skills.import')}
              </Button>
            )}
          </>
        }
        filterBar={
          <div className="flex flex-col gap-space-sm">
            <SkillSearchForm
              draft={draft}
              onDraftChange={setDraft}
              onSubmit={() => {
                setQuery(draft.trim())
                setPage(1)
                if (draft.trim() === query)
                  void (query ? search.refetch() : folders.refetch())
              }}
            />
            <SkillNotices>
              {space.error ? <SkillError error={space.error} /> : null}
              {space.data?.status && !active ? (
                <p className="text-sm text-status-warning">
                  {t(`skills.states.${space.data.status}`)}
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
            description={<SkillError error={listing.error} />}
            onRetry={() => void listing.refetch()}
            retryLabel={t('skills.retry')}
          />
        }
        emptyState={
          query ? (
            <PageEmptyState
              icon={<Search className="size-icon-lg" />}
              title={t('skills.empty')}
              description={t('skills.noMatches')}
            />
          ) : (
            <PageEmptyState
              icon={<PackagePlus className="size-icon-lg" />}
              title={t('skills.empty')}
              description={t('skills.core.emptySpace')}
              action={
                <Button disabled={!active} onClick={() => setDialog('import')}>
                  <Upload className="size-icon-sm" aria-hidden="true" />
                  {t('skills.import')}
                </Button>
              }
            />
          )
        }
        footer={
          <Pager
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        }
      >
        <SkillAssetList
          skills={items}
          metaLabel={`${t('skills.version')} · ${t('skills.tags')}`}
        />
      </CollectionTemplate>
      {dialog === 'import' && space.data && (
        <CoreImportDialog space={space.data} onClose={() => setDialog(null)} />
      )}
      {dialog === 'config' && (
        <CoreConfigDialog space={spaceId} onClose={() => setDialog(null)} />
      )}
      {dialog === 'edit' && space.data && (
        <CoreSpaceDialog space={space.data} onClose={() => setDialog(null)} />
      )}
    </>
  )
}
