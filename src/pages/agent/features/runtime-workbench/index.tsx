import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MessageSquareMore, NotebookText, Play, Square } from 'lucide-react'
import { LogDetail } from '../log-detail'
import { AgentChatBox } from './components/agent-chat-box'
import { AgentRunPanel } from './components/agent-run-panel'
import { RuntimeLogPanel } from './components/runtime-log-panel'
import { RuntimeHeader } from './components/runtime-header'
import { RuntimeWorkbenchView, type RuntimeWorkbenchProps } from './types'

export type { AgentRuntimeController, RuntimeWorkbenchSummary } from './types'
export { AgentRuntimeStatus, RuntimeWorkbenchView } from './types'

export function RuntimeWorkbench({
  open,
  view,
  controller,
  onOpenChange,
  onViewChange,
}: RuntimeWorkbenchProps) {
  const summary = {
    ...controller.summary,
    currentView: view,
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        showCloseButton={false}
        className={cn(
          'top-20 flex h-auto min-w-[420px] max-w-[620px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[620px]',
          'w-[36vw]',
        )}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <SheetTitle className="sr-only">Agent 运行工作台</SheetTitle>
        <SheetDescription className="sr-only">
          配置 Begin 输入、查看运行消息与节点执行时间线
        </SheetDescription>

        <RuntimeHeader
          summary={summary}
          controller={controller}
          onClose={() => onOpenChange(false)}
          onReset={controller.handleReset}
          onViewChange={onViewChange}
        />

        <Tabs
          value={view}
          onValueChange={(nextView) =>
            onViewChange(nextView as RuntimeWorkbenchView)
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="border-border-primary px-space-md py-space-sm border-b">
            <div className="gap-space-sm flex items-center justify-between">
              <TabsList className="w-full justify-start">
                <TabsTrigger value={RuntimeWorkbenchView.RUN}>
                  <Play className="mr-space-xs size-4" />
                  运行
                </TabsTrigger>
                <TabsTrigger value={RuntimeWorkbenchView.CONVERSATION}>
                  <MessageSquareMore className="mr-space-xs size-4" />
                  会话
                </TabsTrigger>
                <TabsTrigger
                  value={RuntimeWorkbenchView.LOG}
                  disabled={
                    !controller.hasLogs &&
                    !controller.sessionId &&
                    !controller.viewingSessionId
                  }
                >
                  <NotebookText className="mr-space-xs size-4" />
                  日志
                </TabsTrigger>
              </TabsList>

              {controller.loading ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={controller.handleStop}
                >
                  <Square className="mr-space-xs size-4" />
                  停止
                </Button>
              ) : null}
            </div>
          </div>

          <TabsContent
            value={RuntimeWorkbenchView.RUN}
            className="mt-0 min-h-0 flex-1 overflow-auto"
          >
            <AgentRunPanel controller={controller} />
          </TabsContent>

          <TabsContent
            value={RuntimeWorkbenchView.CONVERSATION}
            className="mt-0 min-h-0 flex-1 overflow-hidden"
          >
            <AgentChatBox controller={controller} />
          </TabsContent>

          <TabsContent
            value={RuntimeWorkbenchView.LOG}
            className="mt-0 min-h-0 flex-1 overflow-hidden"
          >
            {controller.viewingSessionId && controller.canvasId ? (
              <div className="p-space-md h-full overflow-auto">
                <LogDetail
                  mode="session"
                  canvasId={controller.canvasId}
                  sessionId={controller.viewingSessionId}
                  controller={controller}
                />
              </div>
            ) : (
              <RuntimeLogPanel controller={controller} />
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
