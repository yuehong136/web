import type { RuntimeAttachment, RuntimeMessage } from './types'
import {
  normalizeRuntimeAwaitingInputs,
  normalizeRuntimeAttachments,
} from './utils'

/** Keep ordering evidence on the source row, independently of stream status. */
export function applyRuntimeUserInputs(
  message: RuntimeMessage,
  payload: Record<string, unknown>,
): RuntimeMessage {
  return {
    ...message,
    tips: typeof payload.tips === 'string' ? payload.tips : message.tips,
    awaitingInputs: normalizeRuntimeAwaitingInputs(payload.inputs),
    separateInputPrompt: message.answerCompleted === true && !!message.content,
    isStreaming: false,
  }
}

/** Display rows retain both their local source ID and the real SSE message ID. */
export function splitRuntimeMessages(
  messages: RuntimeMessage[],
): RuntimeMessage[] {
  const ids = new Set(messages.map((message) => message.id))
  return messages.flatMap((message) => {
    if (message.role !== 'assistant' || !message.separateInputPrompt)
      return [message]
    let waitId = JSON.stringify(['agent-input-prompt', message.id])
    while (ids.has(waitId)) waitId += ':'
    ids.add(waitId)
    return [
      { ...message, awaitingInputs: undefined, tips: undefined },
      {
        id: waitId,
        sourceMessageId: message.id,
        role: 'assistant' as const,
        content: '',
        tips: message.tips,
        awaitingInputs: message.awaitingInputs,
        messageId: message.messageId,
        taskId: message.taskId,
        isStreaming: false,
      },
    ]
  })
}

export function clearRuntimeAwaitingInputs(
  messages: RuntimeMessage[],
  displayId: string,
): RuntimeMessage[] {
  const row = splitRuntimeMessages(messages).find(
    (message) => message.id === displayId,
  )
  if (!row) return messages
  const sourceId = row.sourceMessageId ?? row.id
  return messages.map((message) =>
    message.id === sourceId
      ? { ...message, awaitingInputs: undefined }
      : message,
  )
}

export function mergeRuntimeAttachments(
  existing: RuntimeAttachment[] = [],
  ...payloads: unknown[]
): RuntimeAttachment[] {
  const result = [...existing]
  for (const file of payloads.flatMap(normalizeRuntimeAttachments)) {
    if (
      !result.some(
        (item) =>
          item.id === file.id &&
          item.name === file.name &&
          item.url === file.url,
      )
    )
      result.push(file)
  }
  return result
}

export function completeRuntimeMessage(
  message: RuntimeMessage,
  data: unknown,
): RuntimeMessage {
  const payload =
    typeof data === 'object' && data !== null
      ? (data as Record<string, unknown>)
      : {}
  return {
    ...message,
    answerCompleted: true,
    reference: payload.reference ?? message.reference,
    files: mergeRuntimeAttachments(
      message.files,
      payload.attachment,
      payload.downloads,
    ),
    isStreaming: false,
  }
}
