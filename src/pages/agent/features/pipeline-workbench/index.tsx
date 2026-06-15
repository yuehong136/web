import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { FileOutput, NotebookText, Play, Square } from 'lucide-react'
import { SectionCard } from '@/components/patterns'
import { DataflowTimeline } from './components/dataflow-timeline'
import { PipelineHeader } from './components/pipeline-header'
import { PipelineOutputPanel } from './components/pipeline-output-panel'
import { PipelineRunPanel } from './components/pipeline-run-panel'
import {
  PipelineRuntimeStatus,
  PipelineWorkbenchView,
  type PipelineWorkbenchProps,
} from './types'

export type {
  PipelineRuntimeController,
  PipelineWorkbenchProps,
  PipelineWorkbenchSummary,
} from './types'
export { PipelineRuntimeStatus, PipelineWorkbenchView } from './types'

export function PipelineWorkbench({
  open,
  view,
  controller,
  onOpenChange,
  onViewChange,
}: PipelineWorkbenchProps) {
  const summary = {
    ...controller.summary,
    currentView: view,
  }

  const stopActive =
    controller.status === PipelineRuntimeStatus.RUNNING ||
    controller.status === PipelineRuntimeStatus.PREPARING

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent
        showOverlay={false}
        showCloseButton={false}
        className={cn(
          'top-20 flex h-auto min-w-[420px] max-w-[680px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[680px]',
          'w-[40vw]',
        )}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <SheetTitle className="sr-only">Pipeline 运行与日志工作台</SheetTitle>
        <SheetDescription className="sr-only">
          上传文档或填写 Begin 输入，启动 Pipeline
          数据流，查看节点时间线与最终输出
        </SheetDescription>

        <PipelineHeader
          summary={summary}
          onClose={() => onOpenChange(false)}
          onReset={controller.handleReset}
        />

        <Tabs
          value={view}
          onValueChange={(nextView) =>
            onViewChange(nextView as PipelineWorkbenchView)
          }
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="border-border-primary px-space-md py-space-sm border-b">
            <div className="gap-space-sm flex items-center justify-between">
              <TabsList className="w-full justify-start">
                <TabsTrigger value={PipelineWorkbenchView.RUN}>
                  <Play className="mr-space-xs size-4" />
                  运行
                </TabsTrigger>
                <TabsTrigger
                  value={PipelineWorkbenchView.LOG}
                  disabled={!controller.hasLogs}
                >
                  <NotebookText className="mr-space-xs size-4" />
                  日志
                </TabsTrigger>
                <TabsTrigger
                  value={PipelineWorkbenchView.OUTPUT}
                  disabled={!controller.outputAvailable}
                >
                  <FileOutput className="mr-space-xs size-4" />
                  输出
                </TabsTrigger>
              </TabsList>

              {stopActive ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={controller.handleCancel}
                  disabled={controller.cancelling}
                >
                  <Square className="mr-space-xs size-4" />
                  {controller.cancelling ? '取消中…' : '停止'}
                </Button>
              ) : null}
            </div>
          </div>

          <TabsContent
            value={PipelineWorkbenchView.RUN}
            className="mt-0 min-h-0 flex-1 overflow-auto"
          >
            <PipelineRunPanel controller={controller} />
          </TabsContent>

          <TabsContent
            value={PipelineWorkbenchView.LOG}
            className="mt-0 min-h-0 flex-1 overflow-auto"
          >
            <div className="p-space-md">
              <SectionCard title="数据流时间线" padding="default">
                <DataflowTimeline
                  trace={controller.trace}
                  loading={controller.loading}
                />
              </SectionCard>
            </div>
          </TabsContent>

          <TabsContent
            value={PipelineWorkbenchView.OUTPUT}
            className="mt-0 min-h-0 flex-1 overflow-auto"
          >
            <PipelineOutputPanel controller={controller} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
