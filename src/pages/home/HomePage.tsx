/**
 * 首页组件
 *
 * 功能：
 * - 欢迎界面：问候语、功能标签、推荐卡片
 * - 对话界面：消息列表、输入框、工具栏
 * - 支持 @技能 和 @应用
 * - 应用历史对话选择（加载历史消息并继续对话）
 */

import { useCallback } from 'react'
import { useAuthStore } from '@/stores/auth'
import { useHomeStore } from '@/stores/home'
import { WelcomeSection, ChatSection } from './components'
import { useHomeChat } from './hooks'
import { NEW_CONVERSATION_DRAFT, useHomeDrafts } from './hooks/use-home-drafts'

export const HomePage = () => {
  const user = useAuthStore((state) => state.user)

  // 从 store 获取状态
  const {
    selectedMCPIds,
    selectedModelId,
    selectedApps,
    selectedConversationId,
    selectConversation,
  } = useHomeStore()

  // 当前选中的应用（单选）
  const selectedApp = selectedApps.length > 0 ? selectedApps[0] : null

  // 草稿按身份与会话隔离，只留在内存中
  const draftKey = selectedConversationId ?? NEW_CONVERSATION_DRAFT
  const {
    draft: inputValue,
    setDraft: setInputValue,
    clearDraft,
    moveDraft,
  } = useHomeDrafts(`${user?.id ?? ''}:${user?.tenant_id ?? ''}`, draftKey)

  // 新会话拿到服务端 id 时迁移草稿，生成期间写下的下一条不会丢失
  const handleConversationIdChange = useCallback(
    (conversationId: string | null) => {
      if (conversationId) moveDraft(NEW_CONVERSATION_DRAFT, conversationId)
      selectConversation(conversationId)
    },
    [moveDraft, selectConversation],
  )

  // 对话逻辑
  const {
    messages,
    isStreaming,
    streamingContent,
    streamingThinking,
    isToolAnalyzing,
    isLoadingHistory,
    isSendPending,
    sendMessage,
    stopStreaming,
  } = useHomeChat({
    selectedMCPIds,
    selectedModelId,
    selectedApp,
    selectedConversationId,
    onConversationIdChange: handleConversationIdChange,
  })

  // 处理发送：只有被接纳的那份草稿才清空，被拒绝时保留输入
  const handleSend = useCallback(() => {
    if (sendMessage(inputValue) !== false) clearDraft(draftKey, inputValue)
  }, [clearDraft, draftKey, inputValue, sendMessage])

  // 是否显示欢迎界面（加载历史对话时显示对话界面）
  const showWelcome = messages.length === 0 && !isStreaming && !isLoadingHistory

  return (
    <div className="flex h-full flex-col bg-components-console-bg">
      {showWelcome ? (
        <WelcomeSection
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSend}
        />
      ) : (
        <ChatSection
          messages={messages}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSend={handleSend}
          onStop={stopStreaming}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          streamingThinking={streamingThinking}
          isToolAnalyzing={isToolAnalyzing}
          isLoadingHistory={isLoadingHistory}
          isSendPending={isSendPending}
        />
      )}
    </div>
  )
}

export default HomePage
