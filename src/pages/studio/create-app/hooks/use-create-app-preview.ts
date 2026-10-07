import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { conversationAPI } from '@/api/conversation'
import { toast } from '@/lib/toast'
import {
  assertSSEResponse,
  consumeStreamingAnswerChunk,
  createInitialStreamingAnswerState,
  getStreamingAnswerFailureNotice,
  readSSEStream,
  type SSEEnvelope,
} from '@/lib/streaming'
import { extractReferencesFromSSEData } from '@/utils/reference-replacer'
import { configSignature, type PreviewStatus } from '../editor-state'
import type { AppConfig, PreviewMessage } from '../types'
import { buildPrologueMessages } from '../utils'

interface PreviewOptions {
  dialogId: string | null
  savedConfig: AppConfig | null
  canSend: boolean
}
export interface PreviewRunDetails {
  model: string
  overrides: Record<string, number>
  knowledgeCount: number
  elapsedMs: number
  status: PreviewStatus
}

export function useCreateAppPreview(options: PreviewOptions) {
  const { t } = useTranslation()
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [status, setStatus] = useState<PreviewStatus>('idle')
  const [sessionSignature, setSessionSignature] = useState<string | null>(null)
  const [sessionDialogId, setSessionDialogId] = useState<string | null>(null)
  const [previewConversationId, setPreviewConversationId] = useState<
    string | null
  >(null)
  const [runDetails, setRunDetails] = useState<PreviewRunDetails | null>(null)
  const owner = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const busyRef = useRef(false)
  const optionsRef = useRef(options)
  const messagesRef = useRef(previewMessages)
  const conversationRef = useRef<string | null>(null)
  const initialized = useRef(false)
  const startedAt = useRef(0)
  const signatureRef = useRef<string | null>(null)
  const sessionDialogRef = useRef<string | null>(null)
  useLayoutEffect(() => {
    optionsRef.current = options
    messagesRef.current = previewMessages
    signatureRef.current = sessionSignature
    sessionDialogRef.current = sessionDialogId
  }, [options, previewMessages, sessionSignature, sessionDialogId])

  useEffect(() => {
    if (!initialized.current && options.savedConfig) {
      initialized.current = true
      setSessionDialogId(options.dialogId)
      setPreviewMessages(
        buildPrologueMessages(options.savedConfig.prompt_config.prologue),
      )
      setSessionSignature(
        configSignature(options.savedConfig, t('chat.knowledgePrompt.block')),
      )
    }
  }, [options.savedConfig, options.dialogId, t])
  const handleStopOutput = useCallback(() => {
    owner.current++
    abortRef.current?.abort()
    abortRef.current = null
    if (busyRef.current) {
      setStatus('interrupted')
      setRunDetails((previous) =>
        previous
          ? {
              ...previous,
              status: 'interrupted',
              elapsedMs: performance.now() - startedAt.current,
            }
          : previous,
      )
    }
    busyRef.current = false
  }, [])

  useEffect(
    () => () => handleStopOutput(),
    [options.dialogId, handleStopOutput],
  )

  const handleResetPreview = useCallback(
    (snapshot?: AppConfig, applicationId?: string) => {
      handleStopOutput()
      const config = snapshot ?? optionsRef.current.savedConfig
      conversationRef.current = null
      setPreviewConversationId(null)
      setSessionDialogId(applicationId ?? optionsRef.current.dialogId)
      setPreviewMessages(
        config ? buildPrologueMessages(config.prompt_config.prologue) : [],
      )
      setSessionSignature(
        config
          ? configSignature(config, t('chat.knowledgePrompt.block'))
          : null,
      )
      setRunDetails(null)
      setStatus('idle')
      initialized.current = !!config
    },
    [handleStopOutput, t],
  )

  const handleSendPreviewMessage = useCallback(
    async (content: string, historyOverride?: PreviewMessage[]) => {
      const { dialogId, savedConfig, canSend } = optionsRef.current
      if (
        !content.trim() ||
        busyRef.current ||
        !canSend ||
        !dialogId ||
        !savedConfig
      )
        return
      if (
        sessionDialogRef.current !== dialogId ||
        (signatureRef.current &&
          signatureRef.current !==
            configSignature(savedConfig, t('chat.knowledgePrompt.block')))
      )
        return
      busyRef.current = true
      const run = ++owner.current
      const controller = new AbortController()
      abortRef.current = controller
      startedAt.current = performance.now()
      const settings = savedConfig.llm_setting
      const overrides: Record<string, number> = {}
      for (const key of [
        'temperature',
        'top_p',
        'presence_penalty',
        'frequency_penalty',
        'max_tokens',
      ] as const) {
        if (settings[`${key}_enabled`] && settings[key] !== undefined)
          overrides[key] = settings[key]!
      }
      const baseDetails = {
        model: savedConfig.llm_id,
        overrides,
        knowledgeCount: savedConfig.kb_ids.length,
        elapsedMs: 0,
      }
      setRunDetails({ ...baseDetails, status: 'preparing' })
      setStatus('preparing')
      const history = historyOverride ?? messagesRef.current
      const assistantId = `preview-${run}-${crypto.randomUUID()}`
      let appended = false
      const finish = (nextStatus: PreviewStatus) => {
        if (owner.current !== run) return
        setStatus(nextStatus)
        setRunDetails({
          ...baseDetails,
          status: nextStatus,
          elapsedMs: performance.now() - startedAt.current,
        })
      }
      try {
        let conversationId = conversationRef.current
        if (!conversationId) {
          const conversation = await conversationAPI.setConversation({
            dialog_id: dialogId,
            name: t('studio.editor.preview'),
            is_new: true,
          })
          if (owner.current !== run) return
          if (!conversation?.id) throw new Error('missing-conversation')
          conversationId = conversation.id as string
          conversationRef.current = conversationId
          setPreviewConversationId(conversationId)
        }
        if (owner.current !== run) return
        setPreviewMessages([
          ...history,
          {
            id: `user-${crypto.randomUUID()}`,
            role: 'user',
            content: content.trim(),
          },
          { id: assistantId, role: 'assistant', content: '' },
        ])
        appended = true
        setInputValue((current) =>
          current.trim() === content.trim() ? '' : current,
        )
        setStatus('streaming')
        setRunDetails({ ...baseDetails, status: 'streaming' })
        const response = await conversationAPI.completion(
          {
            conversation_id: conversationId!,
            messages: [
              ...history
                .filter((message) => !message.id.startsWith('prologue-'))
                .map(({ role, content }) => ({ role, content })),
              { role: 'user', content: content.trim() },
            ],
            quote: savedConfig.prompt_config.quote,
            stream: true,
          },
          { signal: controller.signal },
        )
        if (owner.current !== run) return
        await assertSSEResponse(response)
        let streamState = createInitialStreamingAnswerState()
        await readSSEStream<SSEEnvelope>(response, {
          signal: controller.signal,
          onEvent: (data) => {
            if (owner.current !== run) return
            const chunk = consumeStreamingAnswerChunk(streamState, data)
            streamState = chunk.nextState
            if (chunk.isDone) return
            const references = extractReferencesFromSSEData(chunk.payload)
            setPreviewMessages((previous) =>
              previous.map((message) =>
                message.id === assistantId
                  ? {
                      ...message,
                      content: streamState.content,
                      thinking: streamState.thinking,
                      ...(references.length ? { references } : {}),
                    }
                  : message,
              ),
            )
          },
        })
        const failure = getStreamingAnswerFailureNotice(streamState)
        finish(
          failure === 'chat.stream.interrupted'
            ? 'interrupted'
            : failure
              ? 'failed'
              : 'completed',
        )
      } catch {
        if (owner.current !== run) return
        finish(controller.signal.aborted ? 'interrupted' : 'failed')
        if (!appended) toast.error(t('studio.editor.sessionFailed'))
      } finally {
        if (owner.current === run) {
          abortRef.current = null
          busyRef.current = false
        }
      }
    },
    [t],
  )

  const handleRetryPreview = useCallback(() => {
    const messages = messagesRef.current
    const index = messages.findLastIndex((message) => message.role === 'user')
    if (index >= 0)
      void handleSendPreviewMessage(
        messages[index].content,
        messages.slice(0, index),
      )
  }, [handleSendPreviewMessage])

  return {
    previewMessages,
    inputValue,
    setInputValue,
    status,
    isStreaming: status === 'preparing' || status === 'streaming',
    sessionSignature,
    sessionDialogId,
    previewConversationId,
    runDetails,
    handleSendPreviewMessage,
    handleStopOutput,
    handleResetPreview,
    handleRetryPreview,
  }
}
