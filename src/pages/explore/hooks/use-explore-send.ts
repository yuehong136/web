import { useCallback, type Dispatch, type SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import { conversationAPI } from '@/api/conversation'
import type { ChatServiceRequest, UploadedFileInfo } from '@/config/chat'
import type { ChatSettings } from '@/components/chat/ChatSettingsPanel'
import type {
  ExploreConversation,
  ExploreMessage,
} from '@/pages/explore/hooks/use-explore-conversation'
import { consumeExploreResponse } from '@/pages/explore/hooks/explore-stream'

interface ExploreSendOptions {
  conversation: ExploreConversation
  selectedApp: string
  selectedModel: string | null
  settings: ChatSettings
  enableReasoning: boolean
  enableInternet: boolean
  uploadedAttachments: UploadedFileInfo[]
  clearUploadFiles: () => void
  setInputValue: Dispatch<SetStateAction<string>>
  refetchConversations: () => unknown
}

const messageId = () => `msg-${crypto.randomUUID()}`

/** Domain send orchestration; session ownership guards every asynchronous write. */
export function useExploreSend({
  conversation,
  selectedApp,
  selectedModel,
  settings,
  enableReasoning,
  enableInternet,
  uploadedAttachments,
  clearUploadFiles,
  setInputValue,
  refetchConversations,
}: ExploreSendOptions) {
  const { t } = useTranslation()
  return useCallback(
    async (
      message: string,
      baseMessages?: ExploreMessage[],
      overrideFiles?: UploadedFileInfo[],
    ) => {
      if (conversation.isStreaming || conversation.isLoadingConversation) return
      const pendingFiles = overrideFiles ?? uploadedAttachments
      const normalized = message.trim()
      const content =
        normalized ||
        (pendingFiles.length ? t('explore.attachmentOnlyPrompt') : '')
      if (!content) return
      const assistantId = messageId()
      const run = conversation.beginRun(assistantId)
      if (!run) return
      const previous = baseMessages ?? conversation.messages
      const updated: ExploreMessage[] = [
        ...previous,
        { role: 'user', content, files: pendingFiles, id: messageId() },
      ]
      conversation.setMessages([
        ...updated,
        {
          role: 'assistant',
          content: '',
          id: assistantId,
          runPhase: 'running',
          references: [],
        },
      ])
      setInputValue('')
      if (!overrideFiles?.length) clearUploadFiles()
      let conversationId = conversation.selectedConversationDetail?.id
      const seed = normalized || pendingFiles[0]?.name || content
      const name = seed.slice(0, 50) + (seed.length > 50 ? '...' : '')

      try {
        if (!conversationId && selectedApp) {
          try {
            const created = await conversationAPI.setConversation({
              dialog_id: selectedApp,
              name,
              is_new: true,
            })
            if (!run.isCurrent()) return
            if (typeof created?.id === 'string' && created.id) {
              conversationId = created.id
              conversation.setActiveConversationKey(created.id)
              conversation.setSelectedConversationDetail({
                id: created.id,
                name,
              })
              void refetchConversations()
            }
          } catch {
            // The existing direct-chat fallback remains available if creation fails.
          }
        } else if (
          !previous.some((item) => item.role === 'user') &&
          conversation.activeConversationKey &&
          selectedApp
        ) {
          try {
            await conversationAPI.setConversation({
              dialog_id: selectedApp,
              conversation_id: conversation.activeConversationKey,
              name,
              is_new: false,
            })
            if (!run.isCurrent()) return
            conversation.setSelectedConversationDetail((detail) =>
              detail ? { ...detail, name } : detail,
            )
            void refetchConversations()
          } catch {
            // A failed title update does not discard the user's question.
          }
        }
        if (!run.isCurrent()) return
        const signal = run.controller.signal
        let response: Response
        if (conversationId) {
          const params: Parameters<typeof conversationAPI.completion>[0] = {
            conversation_id: conversationId,
            messages: updated.map((item) => ({
              role: item.role,
              content: item.content,
              id: item.id,
              ...(item.files?.length ? { files: item.files } : {}),
            })),
            quote: settings.quote,
            reasoning: enableReasoning,
            internet: enableInternet,
            ...(settings.metadataFilterMode === 'manual' &&
            settings.metadataCondition.conditions?.length
              ? { metadata_condition: settings.metadataCondition }
              : {}),
          }
          response = await conversationAPI.completion(params, { signal })
        } else {
          const request: ChatServiceRequest = {
            prompt: '',
            messages: updated.map((item) => ({
              role: item.role,
              content: item.content,
            })),
            llm_name: selectedModel || 'gpt-4o-mini',
            stream: true,
            gen_conf: {},
            tavily_api_key: '',
          }
          response = await conversationAPI.chatServiceStream(request, {
            signal,
          })
        }
        if (!run.isCurrent()) {
          void response.body?.cancel().catch(() => undefined)
          return
        }
        await consumeExploreResponse(response, signal, (state) =>
          run.update({
            content: state.answer.content,
            thinking: state.answer.thinking,
            references: state.references,
            runPhase: state.phase,
          }),
        )
      } catch {
        run.update({ runPhase: 'failed' })
      } finally {
        run.finish()
      }
    },
    [
      conversation,
      selectedApp,
      selectedModel,
      settings,
      enableReasoning,
      enableInternet,
      uploadedAttachments,
      clearUploadFiles,
      setInputValue,
      refetchConversations,
      t,
    ],
  )
}
