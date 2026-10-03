import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppScene, PageEmptyState } from '@/components/patterns'
import { downloadJsonFile } from '@/lib/download'
import { extractSessionStatus } from '../../adapters/session'
import { LogDetail } from '../../features/log-detail'
import { ExploreDebugTab } from '../types'
import type { AgentSession } from '@/types/agent'
import { Download, Activity } from 'lucide-react'
import { AgentRuntimeStatus } from '../../features/runtime-workbench/types'

interface SessionDebugPanelProps {
  canvasId: string
  sessionId: string
  session?: AgentSession
  lastError?: string
  status?: AgentRuntimeStatus
  currentTab: ExploreDebugTab
  onTabChange: (tab: ExploreDebugTab) => void
}

export function SessionDebugPanel({
  canvasId,
  sessionId,
  session,
  lastError,
  status = AgentRuntimeStatus.IDLE,
  currentTab,
  onTabChange,
}: SessionDebugPanelProps) {
  const { t } = useTranslation()
  if (!sessionId) {
    return (
      <PageEmptyState
        compact
        scene={AppScene.WORKSPACE}
        icon={<Activity className="size-icon-lg" />}
        title={t('agent.explore.noDetails')}
        description={t('agent.explore.noDetailsDescription')}
      />
    )
  }
  const hasError =
    status === AgentRuntimeStatus.ERROR ||
    extractSessionStatus(session) === 'error'
  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => onTabChange(value as ExploreDebugTab)}
      className="flex min-h-0 flex-col gap-space-md"
    >
      <TabsList className="w-full">
        <TabsTrigger className="flex-1" value={ExploreDebugTab.SUMMARY}>
          {t('agent.explore.summary')}
        </TabsTrigger>
        <TabsTrigger className="flex-1" value={ExploreDebugTab.LOG}>
          {t('agent.explore.logs')}
        </TabsTrigger>
        <TabsTrigger className="flex-1" value={ExploreDebugTab.RAW}>
          {t('agent.explore.rawData')}
        </TabsTrigger>
      </TabsList>
      <TabsContent value={ExploreDebugTab.SUMMARY} className="mt-0">
        <dl className="space-y-space-lg text-sm">
          {session?.name ? (
            <div>
              <dt className="text-text-secondary">
                {t('agent.explore.conversation')}
              </dt>
              <dd className="mt-space-xs break-words text-text-primary">
                {session.name}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-text-secondary">
              {t('agent.explore.messageCount')}
            </dt>
            <dd className="mt-space-xs text-text-primary">
              {session?.message_count ?? session?.messages?.length ?? 0}
            </dd>
          </div>
          {session?.version_title ? (
            <div>
              <dt className="text-text-secondary">
                {t('agent.explore.version')}
              </dt>
              <dd className="mt-space-xs break-words text-text-primary">
                {session.version_title}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-text-secondary">
              {t('agent.explore.sessionId')}
            </dt>
            <dd className="mt-space-xs break-all text-text-primary">
              {sessionId}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">
              {t('agent.explore.errorSummary')}
            </dt>
            <dd className="mt-space-xs text-text-primary">
              {t(
                hasError
                  ? 'agent.explore.errorDescription'
                  : 'agent.explore.noErrors',
              )}
            </dd>
          </div>
          {status === AgentRuntimeStatus.STOPPED && lastError ? (
            <div>
              <dt className="text-text-secondary">
                {t('agent.explore.stopFeedback')}
              </dt>
              <dd className="mt-space-xs text-text-primary">{lastError}</dd>
            </div>
          ) : null}
        </dl>
      </TabsContent>
      <TabsContent value={ExploreDebugTab.LOG} className="mt-0">
        <LogDetail mode="session" canvasId={canvasId} sessionId={sessionId} />
      </TabsContent>
      <TabsContent
        value={ExploreDebugTab.RAW}
        className="mt-0 space-y-space-md"
      >
        <div className="flex items-center justify-between gap-space-sm">
          <p className="text-xs text-text-secondary">
            {t('agent.explore.rawDescription')}
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={!session}
            onClick={() =>
              downloadJsonFile(session || {}, 'agent-session.json')
            }
          >
            <Download className="size-icon-sm" />
            {t('agent.explore.downloadData')}
          </Button>
        </div>
        <pre className="rounded-radius-md border border-border-default bg-background-subtle p-space-base text-xs break-words whitespace-pre-wrap text-text-secondary">
          {JSON.stringify(session || {}, null, 2)}
        </pre>
      </TabsContent>
    </Tabs>
  )
}
