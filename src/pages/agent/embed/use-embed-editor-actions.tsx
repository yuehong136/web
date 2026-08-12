import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFetchVersionList } from '@/hooks/use-agent-request'
import { formatVersionLabel, resolveLocalizedText } from '@/lib/agent'
import { toast } from '@/lib/toast'
import type { AgentFlow } from '@/types/agent'
import { GlobalVariableSheet } from '../global-variable-sheet'
import { useAgentDeliveryToken } from '../hooks/use-agent-delivery-token'
import { useBuildWebhookUrl } from '../hooks/use-build-webhook-url'
import type { useSaveGraph } from '../hooks/use-save-graph'
import { SettingDialog } from '../setting-dialog'
import { buildAgentShareUrl } from '../share/access'
import { VersionDialog } from '../version-dialog'
import { WebhookSheet } from '../webhook-sheet'

interface UseEmbedEditorActionsParams {
  id: string
  flow?: AgentFlow
  editorMode: 'agent' | 'pipeline'
  title: string
  saving: boolean
  saveGraph: ReturnType<typeof useSaveGraph>['saveGraph']
  onExplore: () => void
  onTitleSaved: (title: string) => void
}

export function useEmbedEditorActions({
  id,
  flow,
  editorMode,
  title,
  saving,
  saveGraph,
  onExplore,
  onTitleSaved,
}: UseEmbedEditorActionsParams) {
  const { t } = useTranslation()
  const deliveryToken = useAgentDeliveryToken(
    Boolean(flow?.id) && editorMode === 'agent',
  )
  const versionQuery = useFetchVersionList(id)
  const webhookUrl = useBuildWebhookUrl()
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [webhookOpen, setWebhookOpen] = useState(false)
  const [globalVariablesOpen, setGlobalVariablesOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [publishedShareUrl, setPublishedShareUrl] = useState('')

  const versions = useMemo(() => {
    return versionQuery.data.map((version, index) => ({
      id: version.id || version.version_id || `version-${index}`,
      name: formatVersionLabel(version, index),
      createdAt: version.create_date || version.update_date || '',
      description: version.description,
      release: Boolean(version.release),
    }))
  }, [versionQuery.data])

  const handlePublish = useCallback(
    async (note: string) => {
      if (!id) return

      try {
        const nextTitle =
          title.trim() ||
          resolveLocalizedText(
            flow?.title,
            t('agent.unnamedAsset', '未命名资产'),
          )
        const saved = await saveGraph(nextTitle, undefined, { release: true })
        if (!saved) {
          toast.error(
            t('agent.editor.publishSaveFailed', '发布失败：当前画布保存未完成'),
          )
          return
        }

        const betaToken = await deliveryToken.ensureToken()
        const shareUrl = buildAgentShareUrl({
          agentId: id,
          betaToken,
          release: true,
        })

        onTitleSaved(nextTitle)
        setPublishedShareUrl(shareUrl)
        toast.success(
          note
            ? t('agent.editor.publishSuccessWithNote', '发布成功：{{note}}', {
                note,
              })
            : t('agent.editor.publishSuccess', '发布成功'),
        )
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t('agent.editor.publishFailed', '发布失败'),
        )
      }
    },
    [deliveryToken, flow?.title, id, onTitleSaved, saveGraph, t, title],
  )

  const panels = flow ? (
    <>
      {versionsOpen && editorMode === 'agent' ? (
        <VersionDialog
          hideModal={() => setVersionsOpen(false)}
          title={
            title ||
            resolveLocalizedText(
              flow.title,
              t('agent.unnamedAsset', '未命名资产'),
            )
          }
          versions={versions}
          isPublished={Boolean(flow.release)}
          lastPublishedAt={flow.last_publish_time || flow.release_time}
          publishLoading={saving || deliveryToken.isLoading}
          publishedShareUrl={publishedShareUrl}
          tokenReady={Boolean(deliveryToken.token)}
          onPublish={handlePublish}
          onOpenWebhook={() => {
            setVersionsOpen(false)
            setWebhookOpen(true)
          }}
          onOpenExplore={onExplore}
        />
      ) : null}

      {webhookOpen && editorMode === 'agent' ? (
        <WebhookSheet
          hideModal={setWebhookOpen}
          webhookUrl={webhookUrl}
          flow={flow}
        />
      ) : null}

      {globalVariablesOpen && editorMode === 'agent' ? (
        <GlobalVariableSheet hideModal={setGlobalVariablesOpen} />
      ) : null}

      {settingsOpen ? (
        <SettingDialog
          agentId={id}
          title={
            title ||
            resolveLocalizedText(
              flow.title,
              t('agent.unnamedAsset', '未命名资产'),
            )
          }
          description={resolveLocalizedText(flow.description, '')}
          hideModal={() => setSettingsOpen(false)}
          onSaved={onTitleSaved}
        />
      ) : null}
    </>
  ) : null

  return {
    panels,
    openVersions: () => setVersionsOpen(true),
    openWebhook: () => setWebhookOpen(true),
    openVariables: () => setGlobalVariablesOpen(true),
    openSettings: () => setSettingsOpen(true),
  }
}
