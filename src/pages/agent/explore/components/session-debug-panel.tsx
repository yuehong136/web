import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { SectionCard } from '@/components/patterns'
import { downloadJsonFile } from '@/lib/download'
import { buildSessionErrorSummary } from '../../adapters/session'
import { LogDetail } from '../../features/log-detail'
import type { ExploreDebugTab } from '../types'
import type { AgentSession } from '@/types/agent'
import { Download } from 'lucide-react'

interface SessionDebugPanelProps {
  canvasId: string
  sessionId: string
  session?: AgentSession
  lastError?: string
  currentTab: ExploreDebugTab
  onTabChange: (tab: ExploreDebugTab) => void
}

export function SessionDebugPanel({
  canvasId,
  sessionId,
  session,
  lastError,
  currentTab,
  onTabChange,
}: SessionDebugPanelProps) {
  if (!sessionId) {
    return (
      <SectionCard title="调试辅助" padding="default">
        <p className="text-sm text-text-secondary">
          选择真实会话后可查看 LogDetail、Trace、Raw JSON 与错误摘要。
        </p>
      </SectionCard>
    )
  }

  const errorSummary = lastError || buildSessionErrorSummary(session)

  return (
    <SectionCard
      title="调试辅助"
      padding="none"
      actions={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadJsonFile(session || {}, 'agent-session.json')}
        >
          <Download className="size-4" />
          Raw
        </Button>
      }
    >
      <Tabs
        value={currentTab}
        onValueChange={(value) => onTabChange(value as ExploreDebugTab)}
        className="flex min-h-0 flex-col"
      >
        <div className="border-b border-border-subtle px-space-base py-space-sm">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="log">LogDetail</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="summary" className="mt-0 p-space-base">
          <div className="space-y-space-base text-sm">
            <div>
              <p className="text-xs font-medium text-text-tertiary">Session</p>
              <p className="mt-space-xs break-all text-text-primary">{sessionId}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-tertiary">Messages</p>
              <p className="mt-space-xs text-text-primary">
                {session?.message_count || session?.messages?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-text-tertiary">Error</p>
              <p className="mt-space-xs whitespace-pre-wrap text-text-primary">
                {errorSummary || '暂无错误摘要'}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="log" className="mt-0 max-h-[calc(100vh-260px)] overflow-auto p-space-base">
          <LogDetail
            mode="session"
            canvasId={canvasId}
            sessionId={sessionId}
          />
        </TabsContent>

        <TabsContent value="raw" className="mt-0 max-h-[calc(100vh-260px)] overflow-auto p-space-base">
          <pre className="whitespace-pre-wrap rounded-radius-md border border-border-primary bg-surface-secondary p-space-base text-xs text-text-secondary">
            {JSON.stringify(session || {}, null, 2)}
          </pre>
        </TabsContent>
      </Tabs>
    </SectionCard>
  )
}
