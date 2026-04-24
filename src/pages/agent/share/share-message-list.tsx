import { Badge } from '@/components/ui/badge'
import { PageEmptyState, AppScene } from '@/components/patterns'
import { cn } from '@/lib/utils'
import type { ShareRuntimeMessage } from './types'

interface ShareMessageListProps {
  messages: ShareRuntimeMessage[]
}

export function ShareMessageList({ messages }: ShareMessageListProps) {
  if (!messages.length) {
    return (
      <PageEmptyState
        scene={AppScene.WORKSPACE}
        compact
        title="尚未提交运行"
        description="填写输入后提交，公共运行结果会显示在这里。"
      />
    )
  }

  return (
    <div className="space-y-space-base">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            'rounded-radius-lg border p-space-base',
            message.role === 'user'
              ? 'border-border-default bg-surface-secondary'
              : 'border-border-subtle bg-surface-primary',
            message.error && 'border-status-error',
          )}
        >
          <div className="mb-space-sm flex items-center justify-between gap-space-sm">
            <Badge variant={message.role === 'user' ? 'secondary' : 'blue'}>
              {message.role === 'user' ? 'You' : 'Agent'}
            </Badge>
            {message.isStreaming ? (
              <span className="text-xs text-text-secondary">运行中...</span>
            ) : null}
          </div>
          {message.thinking ? (
            <div className="mb-space-sm rounded-radius-md bg-surface-secondary p-space-sm text-xs text-text-secondary">
              {message.thinking}
            </div>
          ) : null}
          <div className="whitespace-pre-wrap text-sm leading-6 text-text-primary">
            {message.content || (message.isStreaming ? '等待响应...' : '')}
          </div>
          {message.files?.length ? (
            <div className="mt-space-sm flex flex-wrap gap-space-xs">
              {message.files.map((file) => (
                <Badge key={file.id || file.name} variant="outline">
                  {file.name || file.filename || file.id}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
