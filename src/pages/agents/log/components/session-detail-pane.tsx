import { MessageSquare } from 'lucide-react'
import { LogDetail } from '@/pages/agent/features/log-detail'

interface SessionDetailPaneProps {
  canvasId?: string
  sessionId?: string
}

export function SessionDetailPane({
  canvasId,
  sessionId,
}: SessionDetailPaneProps) {
  if (!canvasId || !sessionId) {
    return (
      <div className="p-space-xl flex h-full flex-col items-center justify-center bg-components-split-pane-bg text-center">
        <div className="mb-space-base rounded-radius-lg shadow-elevation-low flex h-14 w-14 items-center justify-center border border-border-default bg-components-console-surface text-text-tertiary">
          <MessageSquare className="size-6" />
        </div>
        <h3 className="text-base font-semibold text-text-primary">
          从左侧选择一条 session
        </h3>
        <p className="mt-space-xs max-w-sm text-sm leading-relaxed text-text-tertiary">
          右侧会展示完整的消息回放、Trace 时间线、输入输出与 Raw 数据。
        </p>
      </div>
    )
  }

  return <LogDetail mode="session" canvasId={canvasId} sessionId={sessionId} />
}
