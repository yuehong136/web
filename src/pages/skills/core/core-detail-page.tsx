import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ConsolePageTemplate } from '@/components/page-templates'
import { PageHeader, PageLoadingState } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import {
  useCoreSpace,
  useCoreChildren,
  useCoreTree,
  useCoreFile,
  useCoreAction,
} from '@/hooks/use-skill-core-request'
import { coreVersions } from '@/api/skill-core-types'
import { skillCoreAPI } from '@/api/skill-core'
import { APIError } from '@/api/client'
import { SkillSelect } from '../skill-select'
import { SkillFileTree } from '../skill-file-tree'
import { SkillDocument } from '../skill-document'
import { SkillError, SkillDeleteDialog } from '../skill-shared'

export function CoreDetailPage() {
  const { spaceId = '', skillId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const space = useCoreSpace(spaceId)
  const siblings = useCoreChildren(space.data?.folder_id || '')
  const skill = siblings.data?.find((item) => item.id === skillId)
  const children = useCoreChildren(skillId)
  const versions = coreVersions(children.data || [])
  const requested = params.get('version')
  const selected = children.data?.find(
    (item) => item.id === requested && item.type === 'folder',
  )
  const current = selected || versions[0]
  const tree = useCoreTree(children.data ? current?.id || skillId : '')
  const file =
    tree.data?.find((item) => item.path === params.get('file')) ||
    tree.data?.find((item) => item.path === 'SKILL.md') ||
    tree.data?.[0]
  const content = useCoreFile(file?.id || '')
  const action = useCoreAction()
  const [deleting, setDeleting] = useState<'skill' | 'version' | null>(null)
  const [indexState, setIndexState] = useState<'ready' | 'removed' | null>(null)
  const [pane, setPane] = useState<'files' | 'preview'>('preview')
  const change = (key: string, value: string) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.set(key, value)
        if (key === 'version') next.delete('file')
        return next
      },
      { replace: true },
    )
  const writable = space.data?.status === 'active'
  return (
    <ConsolePageTemplate
      header={
        <PageHeader
          title={skill?.name || t('skills.title')}
          description={t('skills.core.versionDescription')}
          wrapActions
          actions={
            <>
              <Button variant="outline" asChild>
                <Link to={`/skills/${spaceId}`}>{t('skills.back')}</Link>
              </Button>
              <Button
                variant="destructive"
                disabled={!skill || !writable || action.isPending}
                onClick={() => setDeleting('skill')}
              >
                {t('skills.uninstall')}
              </Button>
            </>
          }
        />
      }
    >
      <div className="flex flex-col gap-space-base p-space-lg">
        <SkillError
          error={
            space.error ||
            siblings.error ||
            children.error ||
            tree.error ||
            action.error
          }
        />
        {children.isLoading ? (
          <PageLoadingState title={t('skills.loading')} description="" />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-space-base">
              {!!versions.length && (
                <span className="text-sm text-text-secondary">
                  {t('skills.core.defaultVersion', {
                    version: versions[0].name,
                  })}
                </span>
              )}
              {current && (
                <Button
                  variant="ghost"
                  disabled={!writable || action.isPending}
                  onClick={() => setDeleting('version')}
                >
                  {t('skills.deleteVersion')}
                </Button>
              )}
              <details>
                <summary className="cursor-pointer text-sm font-medium">
                  {t('skills.history')}
                </summary>
                <SkillSelect
                  label={t('skills.version')}
                  value={current?.id || skillId}
                  options={[
                    ...(versions.length
                      ? []
                      : [
                          {
                            value: skillId,
                            label: t('skills.core.legacyVersion'),
                          },
                        ]),
                    ...[
                      ...versions,
                      ...(children.data || []).filter(
                        (item) =>
                          item.type === 'folder' &&
                          !versions.some((version) => version.id === item.id),
                      ),
                    ].map((item) => ({ value: item.id, label: item.name })),
                  ]}
                  onChange={(id) => change('version', id)}
                />
              </details>
            </div>
            <div className="flex gap-space-sm md:hidden">
              <Button
                variant={pane === 'files' ? 'default' : 'outline'}
                onClick={() => setPane('files')}
              >
                {t('skills.files')}
              </Button>
              <Button
                variant={pane === 'preview' ? 'default' : 'outline'}
                onClick={() => setPane('preview')}
              >
                {t('skills.preview')}
              </Button>
            </div>
            <div className="grid min-h-0 gap-space-lg md:grid-cols-[minmax(180px,1fr)_minmax(0,3fr)]">
              <nav
                aria-label={t('skills.files')}
                className={`${pane === 'files' ? '' : 'hidden'} min-w-0 overflow-auto md:block`}
              >
                {tree.isLoading ? (
                  <PageLoadingState
                    compact
                    title={t('skills.loading')}
                    description=""
                  />
                ) : (
                  <SkillFileTree
                    files={tree.data || []}
                    selected={file?.path || ''}
                    onSelect={(path) => {
                      change('file', path)
                      setPane('preview')
                    }}
                  />
                )}
              </nav>
              <section
                className={`${pane === 'preview' ? '' : 'hidden'} min-w-0 md:block`}
              >
                <SkillDocument
                  path={file?.path || ''}
                  blob={content.data}
                  error={content.error}
                />
              </section>
            </div>
            <details className="border-t border-border-default pt-space-base">
              <summary className="cursor-pointer text-sm font-medium">
                {t('skills.advanced')}
              </summary>
              <div className="flex flex-wrap items-center gap-space-sm pt-space-base">
                <Button
                  variant="outline"
                  disabled={!writable || action.isPending}
                  onClick={() =>
                    action.mutate(async () => {
                      const result = await skillCoreAPI.reindex(spaceId)
                      if (result.failed_count)
                        throw new APIError(
                          200,
                          'CORE_INDEX_PARTIAL',
                          'Index incomplete',
                        )
                      setIndexState('ready')
                    })
                  }
                >
                  {t('skills.reindex')}
                </Button>
                <Button
                  variant="ghost"
                  disabled={!skill || !writable || action.isPending}
                  onClick={() => {
                    if (skill)
                      action.mutate(async () => {
                        await skillCoreAPI.deleteIndex(spaceId, skill.name)
                        setIndexState('removed')
                      })
                  }}
                >
                  {t('skills.core.removeIndex')}
                </Button>
                {indexState && (
                  <p aria-live="polite" className="text-sm text-text-secondary">
                    {t(
                      indexState === 'ready'
                        ? 'skills.core.indexReady'
                        : 'skills.core.indexRemoved',
                    )}
                  </p>
                )}
              </div>
            </details>
          </>
        )}
      </div>
      <SkillDeleteDialog
        open={!!deleting}
        pending={action.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() =>
          action.mutate(
            async () => {
              const result = await skillCoreAPI.removeFiles([
                deleting === 'version' && current ? current.id : skillId,
              ])
              if (
                result !== true &&
                (result.errors.length || result.success_count < 1)
              )
                throw new APIError(
                  200,
                  'CORE_DELETE_PARTIAL',
                  'Delete incomplete',
                )
            },
            {
              onSuccess: () => {
                if (deleting === 'skill') navigate(`/skills/${spaceId}`)
                else {
                  setDeleting(null)
                  setParams(new URLSearchParams(), { replace: true })
                  setIndexState(null)
                }
              },
            },
          )
        }
      />
    </ConsolePageTemplate>
  )
}
