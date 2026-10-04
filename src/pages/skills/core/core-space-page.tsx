import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Upload, Settings2, FileText } from 'lucide-react'
import { ListPageTemplate } from '@/components/page-templates'
import {
  PageLoadingState,
  PageEmptyState,
  PageErrorState,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useCoreSpace,
  useCoreSearch,
  useCoreChildren,
} from '@/hooks/use-skill-core-request'
import { SkillError, SkillPagination } from '../skill-shared'
import { CoreConfigDialog } from './core-config-dialog'
import { CoreImportDialog } from './core-import-dialog'
import { CoreSpaceDialog } from './core-space-dialog'

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
          skills: browse.slice((page - 1) * 20, page * 20).map((file) => ({
            folder_id: file.id,
            name: file.name,
            description: '',
            version: undefined,
            tags: [] as string[],
          })),
        },
      }
  return (
    <>
      <ListPageTemplate
        title={space.data?.name || t('skills.title')}
        description={space.data?.description || t('skills.discoverDescription')}
        headerActions={
          <>
            <Button variant="ghost" asChild>
              <Link to="/skills">{t('skills.back')}</Link>
            </Button>
            <Button
              disabled={space.data?.status !== 'active'}
              onClick={() => setDialog('import')}
            >
              <Upload className="size-icon-sm" />
              {t('skills.import')}
            </Button>
            <Button
              variant="outline"
              disabled={!space.data}
              onClick={() => setDialog('config')}
            >
              <Settings2 className="size-icon-sm" />
              {t('skills.configuration')}
            </Button>
          </>
        }
        toolbarLeft={
          <form
            className="flex w-full items-center gap-space-sm"
            onSubmit={(event) => {
              event.preventDefault()
              setQuery(draft.trim())
              setPage(1)
              if (draft.trim() === query)
                void (query ? search.refetch() : folders.refetch())
            }}
          >
            <Input
              aria-label={t('skills.query')}
              placeholder={t('skills.query')}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <Button type="submit" variant="outline">
              <Search className="size-icon-sm" />
              {t('skills.search')}
            </Button>
          </form>
        }
        toolbarRight={
          <Button
            variant="ghost"
            disabled={!space.data}
            onClick={() => setDialog('edit')}
          >
            {t('skills.editSpace')}
          </Button>
        }
        pagination={
          <SkillPagination
            page={page}
            total={listing.data?.total || 0}
            setPage={setPage}
          />
        }
      >
        <div className="flex flex-col gap-space-base">
          <SkillError error={space.error} />
          {space.data?.status && space.data.status !== 'active' && (
            <p>{t(`skills.states.${space.data.status}`)}</p>
          )}
          {listing.isLoading ? (
            <PageLoadingState title={t('skills.loading')} description="" />
          ) : listing.error ? (
            <PageErrorState
              title={t('skills.error')}
              description={<SkillError error={listing.error} />}
              onRetry={() => void listing.refetch()}
              retryLabel={t('skills.retry')}
            />
          ) : !listing.data?.skills.length ? (
            <PageEmptyState
              title={t('skills.empty')}
              description={t(
                query ? 'skills.noMatches' : 'skills.core.emptySpace',
              )}
            />
          ) : (
            <div className="grid gap-space-base md:grid-cols-2 xl:grid-cols-3">
              {listing.data.skills.map((skill) => (
                <Link
                  key={skill.folder_id}
                  to={`/skills/${spaceId}/skills/${encodeURIComponent(skill.folder_id)}`}
                  className="flex flex-col gap-space-base rounded-radius-lg border border-border-default bg-background-surface p-space-lg hover:bg-state-hover"
                >
                  <div className="flex items-center gap-space-sm">
                    <FileText className="size-icon-md text-text-secondary" />
                    <strong className="truncate">{skill.name}</strong>
                  </div>
                  <p className="line-clamp-3 text-sm text-text-secondary">
                    {skill.description || t('skills.core.readDescription')}
                  </p>
                  <div className="flex flex-wrap gap-space-sm text-xs text-text-caption">
                    <span>{t('skills.localSource')}</span>
                    {skill.version && <span>{skill.version}</span>}
                    {skill.tags?.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </ListPageTemplate>
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
