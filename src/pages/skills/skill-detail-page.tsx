import { SkillDocument } from './skill-document'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SkillFileTree } from './skill-file-tree'
import { skillsAPI } from '@/api/skills'
import {
  useSkillAction,
  useSkillCapabilities,
  useSkillDetail,
  useSkillFile,
  useSkillFiles,
  useSkillSpace,
} from '@/hooks/use-skill-request'
import { ConsolePageTemplate } from '@/components/page-templates'
import { PageHeader, PageLoadingState } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { SkillSelect } from './skill-select'
import {
  SkillDeleteDialog,
  SkillError,
  SkillOperations,
  saveSkillBlob,
  useSkillOperationRoute,
} from './skill-shared'

function FilePreview({
  space,
  version,
  path,
}: {
  space: string
  version: string
  path: string
}) {
  const query = useSkillFile(space, version, path)
  return <SkillDocument path={path} blob={query.data} error={query.error} />
}

export function SkillDetailPage() {
  const { spaceId = '', skillId = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const { t } = useTranslation()
  const [deleting, setDeleting] = useState<'skill' | 'version' | null>(null)
  const [mobilePane, setMobilePane] = useState<'files' | 'preview'>('preview')
  const tracker = useSkillOperationRoute()
  const action = useSkillAction(tracker.accepted)
  const detail = useSkillDetail(spaceId, skillId)
  const space = useSkillSpace(spaceId)
  const capabilities = useSkillCapabilities()
  const skill = detail.data?.skill
  const versions = detail.data?.versions || []
  const requestedVersion = params.get('version')
  const chosenVersion = versions.some((item) => item.id === requestedVersion)
    ? requestedVersion!
    : skill?.active_version_id || versions[0]?.id || ''
  const version = versions.find((item) => item.id === chosenVersion)
  const files = useSkillFiles(spaceId, version?.id || '')
  const file =
    params.get('file') ||
    files.data?.files.find((item) => item.path === 'SKILL.md')?.path ||
    files.data?.files[0]?.path ||
    ''
  const writable =
    capabilities.data?.writable &&
    space.data?.backend_owner === capabilities.data?.backend &&
    space.data?.state === 'active'
  const setSelection = (key: string, value: string) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.set(key, value)
        if (key === 'version') next.delete('file')
        return next
      },
      { replace: true },
    )
  return (
    <ConsolePageTemplate
      header={
        <PageHeader
          title={skill?.name || t('skills.title')}
          description={skill?.description}
          wrapActions
          actions={
            <>
              <Button variant="outline" asChild>
                <Link to={tracker.href(`/skills/${spaceId}`)}>
                  {t('skills.back')}
                </Link>
              </Button>
              <Button
                variant="destructive"
                disabled={!writable || !skill || action.isPending}
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
        <SkillOperations tracker={tracker} />
        <SkillError
          error={
            detail.error || space.error || capabilities.error || action.error
          }
        />
        {detail.isLoading ? (
          <PageLoadingState title={t('skills.loading')} description="" />
        ) : (
          skill && (
            <>
              <p className="text-sm text-text-secondary">
                {t('skills.immutable')}
              </p>
              {!writable && capabilities.data && (
                <p className="text-sm text-status-warning">
                  {t(
                    capabilities.data?.writable === false
                      ? 'skills.readOnly'
                      : 'skills.ownerMismatch',
                  )}
                </p>
              )}
              <div className="flex flex-wrap items-end gap-space-sm">
                <SkillSelect
                  label={t('skills.version')}
                  value={chosenVersion}
                  options={versions.map((item) => ({
                    value: item.id,
                    label: `${item.version}${item.id === skill.active_version_id ? ` · ${t('skills.active')}` : ''}`,
                  }))}
                  onChange={(id) => setSelection('version', id)}
                />
                <Button
                  variant="outline"
                  disabled={
                    !writable ||
                    action.isPending ||
                    !version ||
                    version.state !== 'installed' ||
                    version.id === skill.active_version_id
                  }
                  onClick={() => {
                    if (!version) return
                    const key = action.requestKey(
                      `activate/${skillId}/${version.id}/${skill.revision}`,
                    )
                    action.mutate(() =>
                      skillsAPI.activate(
                        spaceId,
                        skillId,
                        version.id,
                        skill.revision,
                        key,
                      ),
                    )
                  }}
                >
                  {t('skills.setActive')}
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    !writable || action.isPending || !skill.active_version_id
                  }
                  onClick={() => {
                    const key = action.requestKey(
                      `activate/${skillId}/none/${skill.revision}`,
                    )
                    action.mutate(() =>
                      skillsAPI.activate(
                        spaceId,
                        skillId,
                        null,
                        skill.revision,
                        key,
                      ),
                    )
                  }}
                >
                  {t('skills.clearActive')}
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    !version ||
                    version.state !== 'installed' ||
                    action.isPending
                  }
                  onClick={() => {
                    if (!version) return
                    action.mutate(async () =>
                      saveSkillBlob(
                        await skillsAPI.download(spaceId, version.id),
                        `${skill.name}-${version.version}.zip`,
                      ),
                    )
                  }}
                >
                  {t('skills.download')}
                </Button>
                <Button
                  variant="ghost"
                  disabled={
                    !writable ||
                    !version ||
                    action.isPending ||
                    version.id === skill.active_version_id
                  }
                  onClick={() => setDeleting('version')}
                >
                  {t('skills.deleteVersion')}
                </Button>
              </div>
              {version && (
                <p className="text-sm">
                  {t(`skills.states.${version.state}`)} ·{' '}
                  {t(`skills.states.${version.index_state}`)} ·{' '}
                  {t('skills.size', {
                    count: version.file_count,
                    bytes: version.total_size.toLocaleString(),
                  })}
                </p>
              )}
              <SkillError error={files.error} />
              <div className="flex gap-space-sm md:hidden">
                <Button
                  variant={mobilePane === 'files' ? 'default' : 'outline'}
                  onClick={() => setMobilePane('files')}
                >
                  {t('skills.files')}
                </Button>
                <Button
                  variant={mobilePane === 'preview' ? 'default' : 'outline'}
                  onClick={() => setMobilePane('preview')}
                >
                  {t('skills.preview')}
                </Button>
              </div>
              <div className="grid min-h-0 gap-space-lg md:grid-cols-[minmax(180px,1fr)_minmax(0,3fr)]">
                <nav
                  aria-label={t('skills.files')}
                  className={`${mobilePane === 'files' ? '' : 'hidden'} min-w-0 overflow-auto md:block`}
                >
                  {files.isLoading ? (
                    <PageLoadingState
                      compact
                      title={t('skills.loading')}
                      description=""
                    />
                  ) : (
                    <SkillFileTree
                      files={files.data?.files || []}
                      selected={file}
                      onSelect={(path) => {
                        setSelection('file', path)
                        setMobilePane('preview')
                      }}
                    />
                  )}
                </nav>
                <section
                  className={`${mobilePane === 'preview' ? '' : 'hidden'} min-w-0 md:block`}
                >
                  <FilePreview
                    space={spaceId}
                    version={version?.id || ''}
                    path={file}
                  />
                </section>
              </div>
            </>
          )
        )}
      </div>
      <SkillDeleteDialog
        open={!!deleting}
        pending={action.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          const key = action.requestKey(
            `delete/${skillId}/${deleting}/${version?.id || ''}`,
          )
          action.mutate(
            () =>
              deleting === 'version' && version
                ? skillsAPI.deleteVersion(spaceId, version.id, key)
                : skillsAPI.uninstall(spaceId, [skillId], key),
            { onSuccess: () => setDeleting(null) },
          )
        }}
      />
    </ConsolePageTemplate>
  )
}
