import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Operator } from '../constant'
import type { INodeEvent } from '../hooks/use-node-loading'
import OperatorIcon from '../operator-icon'

// 消息事件类型
export const MessageEventType = {
  NodeStarted: 'node_started',
  NodeFinished: 'node_finished',
  WorkflowFinished: 'workflow_finished',
  Message: 'message',
  Error: 'error',
} as const

interface LogFlowTimelineProps {
  currentEventListWithoutMessage: INodeEvent[]
  sendLoading: boolean
}

export const WorkFlowTimeline = ({
  currentEventListWithoutMessage = [],
  sendLoading,
}: LogFlowTimelineProps) => {
  const { t } = useTranslation()

  const getNodeName = useCallback(
    (nodeId: string) => {
      if (nodeId === 'begin') return t('flow.begin', '开始')
      return nodeId
    },
    [t],
  )

  const startedNodeList = useMemo(() => {
    const duplicateList = currentEventListWithoutMessage.filter(
      (x) => x.event === MessageEventType.NodeStarted,
    )

    // 去重
    return duplicateList.reduce<INodeEvent[]>((pre, cur) => {
      if (pre.every((x) => x.data.component_id !== cur.data.component_id)) {
        pre.push(cur)
      }
      return pre
    }, [])
  }, [currentEventListWithoutMessage])

  const getElapsedTime = useCallback(
    (nodeId: string) => {
      if (nodeId === 'begin') return ''

      const data = currentEventListWithoutMessage.find(
        (x) =>
          x.data.component_id === nodeId &&
          x.event === MessageEventType.NodeFinished,
      )

      if (!data || (data.data.elapsed_time && data.data.elapsed_time < 0.000001)) {
        return ''
      }

      return data.data.elapsed_time?.toString().slice(0, 6) || ''
    },
    [currentEventListWithoutMessage],
  )

  const filterFinishedNodeList = useCallback(
    (componentId: string) => {
      return currentEventListWithoutMessage
        .filter(
          (x) =>
            x.event === MessageEventType.NodeFinished &&
            x.data.component_id === componentId,
        )
        .map((x) => x.data)
    },
    [currentEventListWithoutMessage],
  )

  if (startedNodeList.length === 0) {
    return (
      <div className="text-center text-text-secondary py-space-xl">
        {t('flow.noLogs', '暂无日志')}
      </div>
    )
  }

  return (
    <div className="space-y-space-base">
      {startedNodeList.map((x, idx) => {
        const componentId = x.data.component_id || ''
        const nodeDataList = filterFinishedNodeList(componentId)
        const finishNodeIds = nodeDataList
          .map((n) => n.component_id)
          .filter((nodeId): nodeId is string => Boolean(nodeId))
        const inputs = nodeDataList[0]?.inputs || {}
        const outputs = nodeDataList[0]?.outputs || {}
        const nodeLabel = x.data.component_type

        return (
          <div key={idx} className="relative pl-space-xl">
            {/* 时间线连接线 */}
            {idx < startedNodeList.length - 1 && (
              <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-surface-accent" />
            )}

            {/* 节点指示器 */}
            <div className="absolute left-0 top-0 flex items-center justify-center">
                <div
                  className={cn(
                    'flex items-center justify-center size-6 rounded-full border-2',
                    finishNodeIds.includes(componentId)
                      ? 'border-status-success bg-surface-primary'
                      : sendLoading
                        ? 'border-status-warning bg-surface-primary animate-pulse'
                      : 'border-border-default bg-surface-secondary',
                )}
              >
                <OperatorIcon
                  className="size-4"
                  name={nodeLabel as Operator}
                />
              </div>
            </div>

            {/* 节点内容 */}
            <div className="rounded-radius-md border border-border-default bg-surface-primary">
              <Accordion type="single" collapsible className="px-space-sm">
                <AccordionItem value={idx.toString()} className="border-none">
                  <AccordionTrigger className="hover:no-underline py-space-sm">
                    <div className="flex gap-space-sm items-center">
                      <span className="font-medium">
                        {getNodeName(x.data.component_name || '')}
                      </span>
                      {getElapsedTime(componentId) && (
                        <span className="text-text-secondary text-xs">
                          {getElapsedTime(componentId)}s
                        </span>
                      )}
                      <span
                        className={cn(
                          'size-2 rounded-full',
                          !x.data.error ? 'bg-status-success' : 'bg-status-error',
                        )}
                      />
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-space-sm">
                      {/* 输入 */}
                      <div>
                        <div className="text-xs text-text-secondary mb-space-xs">
                          {t('flow.input', '输入')}
                        </div>
                        <pre className="text-xs bg-surface-secondary p-space-sm rounded-radius-sm overflow-auto max-h-40">
                          {JSON.stringify(inputs, null, 2)}
                        </pre>
                      </div>

                      {/* 输出 */}
                      <div>
                        <div className="text-xs text-text-secondary mb-space-xs">
                          {t('flow.output', '输出')}
                        </div>
                        <pre className="text-xs bg-surface-secondary p-space-sm rounded-radius-sm overflow-auto max-h-40">
                          {JSON.stringify(outputs, null, 2)}
                        </pre>
                      </div>

                      {/* 错误信息 */}
                      {x.data.error && (
                        <div>
                          <div className="text-xs text-status-error mb-space-xs">
                            {t('flow.error', '错误')}
                          </div>
                          <pre className="text-xs bg-status-error/10 text-status-error p-space-sm rounded-radius-sm overflow-auto">
                            {x.data.error}
                          </pre>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        )
      })}
    </div>
  )
}
