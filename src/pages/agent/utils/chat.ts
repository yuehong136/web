import isEmpty from 'lodash/isEmpty.js'

export interface IMessage {
  id: string
  role: string
  content?: string
  reference?: IReference
  [key: string]: any
}

export interface IReference {
  doc_aggs?: any[]
  chunks?: any[]
  total?: number
}

export const MessageType = {
  User: 'user',
  Assistant: 'assistant',
  System: 'system',
} as const

export const buildAgentMessageItemReference = (
  conversation: { message: IMessage[]; reference: IReference[] },
  message: IMessage,
) => {
  const assistantMessages = conversation.message?.filter(
    (x) => x.role === MessageType.Assistant,
  )
  const referenceIndex = assistantMessages.findIndex(
    (x) => x.id === message.id,
  )
  const reference = !isEmpty(message?.reference)
    ? message?.reference
    : (conversation?.reference ?? [])[referenceIndex]

  return reference ?? { doc_aggs: [], chunks: [], total: 0 }
}
