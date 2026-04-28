/**
 * 首页组件
 * 
 * 功能：
 * - 欢迎界面：问候语、功能标签、推荐卡片
 * - 对话界面：消息列表、输入框、工具栏
 * - 支持 @技能 和 @应用
 * - 应用历史对话选择（加载历史消息并继续对话）
 */

import React, { useState, useCallback } from 'react'
import { useHomeStore } from '@/stores/home'
import { WelcomeSection, ChatSection } from './components'
import { useHomeChat } from './hooks'

export const HomePage: React.FC = () => {
  const [inputValue, setInputValue] = useState('')
  
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

  // 对话逻辑
  const {
    messages,
    isStreaming,
    streamingContent,
    streamingThinking,
    streamingToolCalls,
    isToolAnalyzing,
    isLoadingHistory,
    sendMessage,
    stopStreaming,
  } = useHomeChat({
    selectedMCPIds,
    selectedModelId,
    selectedApp,
    selectedConversationId,
    onConversationIdChange: selectConversation,
  })

  // 处理发送
  const handleSend = useCallback(() => {
    if (inputValue.trim()) {
      sendMessage(inputValue)
      setInputValue('')
    }
  }, [inputValue, sendMessage])

  // 是否显示欢迎界面（加载历史对话时显示对话界面）
  const showWelcome = messages.length === 0 && !isStreaming && !isLoadingHistory

  return (
    <div className="h-full bg-background-subtle flex flex-col">
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
          streamingToolCalls={streamingToolCalls}
          isToolAnalyzing={isToolAnalyzing}
          isLoadingHistory={isLoadingHistory}
        />
      )}
    </div>
  )
}

export default HomePage
