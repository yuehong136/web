import { MessageParts, type MessagePartsProps } from './message-parts'
import type { RunPhase } from '@/lib/streaming'

/** Existing application consumers keep their protocol-specific streaming flag. */
export interface AppChatAnswerProps extends Omit<MessagePartsProps, 'run'> {
  isStreaming: boolean
  runPhase?: RunPhase
}
export function AppChatAnswer({
  isStreaming,
  runPhase,
  ...props
}: AppChatAnswerProps) {
  return (
    <MessageParts
      {...props}
      run={{ phase: runPhase ?? (isStreaming ? 'running' : undefined) }}
    />
  )
}
