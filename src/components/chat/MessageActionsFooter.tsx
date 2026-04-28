/**
 * 消息操作按钮组件
 * 用于显示消息底部的操作按钮，包括复制、TTS 朗读、重新生成、点赞/踩
 * 
 * 由于使用了 useSpeech hook，每条消息需要创建独立的组件实例
 */
import React from 'react'
import { 
  RotateCcw, 
} from 'lucide-react'
import { Actions } from '@ant-design/x'
import type { ActionsProps } from '@ant-design/x'
import { useSpeech } from '@/hooks/use-speech'

export interface MessageActionsFooterProps {
  /** 消息内容（用于 TTS 朗读） */
  content: string
  /** 复制回调 */
  onCopy: () => void
  /** 重新生成回调 */
  onRegenerate?: () => void
  /** 点赞回调 */
  onLike?: () => void
  /** 踩回调 */
  onDislike?: () => void
  /** 是否显示重新生成按钮 */
  showRegenerate?: boolean
  /** 是否显示点赞/踩按钮 */
  showFeedback?: boolean
  /** 是否显示 TTS 按钮 */
  showTTS?: boolean
  /** 自定义类名 */
  className?: string
}

/**
 * 消息操作按钮组件
 * 
 * 功能：
 * - 复制内容到剪贴板
 * - TTS 文字转语音朗读
 * - 重新生成回答
 * - 点赞/踩反馈
 * 
 * @example
 * <MessageActionsFooter
 *   content={mainContent}
 *   onCopy={() => copyToClipboard(mainContent)}
 *   onRegenerate={handleRegenerate}
 *   onLike={handleLike}
 *   onDislike={handleDislike}
 * />
 */
export const MessageActionsFooter: React.FC<MessageActionsFooterProps> = React.memo(({
  content,
  onCopy,
  onRegenerate,
  onLike,
  onDislike,
  showRegenerate = true,
  showFeedback = true,
  showTTS = true,
  className
}) => {
  const { isPlaying, isLoading, handleTogglePlay, audioRef } = useSpeech(content)
  const [feedbackValue, setFeedbackValue] = React.useState<'like' | 'dislike' | 'default'>('default')
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const handleFeedbackChange = React.useCallback((value: 'like' | 'dislike' | 'default') => {
    setFeedbackValue(value)
    if (value === 'like') {
      onLike?.()
    }
    if (value === 'dislike') {
      onDislike?.()
    }
  }, [onLike, onDislike])

  // 构建操作项列表
  const actionItems = React.useMemo<ActionsProps['items']>(() => {
    const items: ActionsProps['items'] = [
      {
        key: 'copy',
        actionRender: () => <Actions.Copy text={content} onClick={onCopy} />,
      }
    ]

    if (showTTS) {
      items.push({
        key: 'tts',
        actionRender: () => (
          <Actions.Audio
            status={isLoading ? 'loading' : isPlaying ? 'running' : 'default'}
            onClick={handleTogglePlay}
          />
        ),
      })
    }

    if (showRegenerate && onRegenerate) {
      items.push({
        key: 'regenerate',
        actionRender: () => (
          <Actions.Item
            defaultIcon={<RotateCcw className="h-3 w-3" />}
            label="重新生成"
            onClick={onRegenerate}
          />
        ),
      })
    }

    if (showFeedback && (onLike || onDislike)) {
      items.push({
        key: 'feedback',
        actionRender: () => (
          <Actions.Feedback value={feedbackValue} onChange={handleFeedbackChange} />
        ),
      })
    }

    return items
  }, [content, feedbackValue, handleFeedbackChange, handleTogglePlay, isLoading, isPlaying, onCopy, onRegenerate, onLike, onDislike, showFeedback, showRegenerate, showTTS])

  return (
    <div
      className={className || "mt-2 flex justify-start"}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(4px)',
        transition: 'opacity 180ms ease, transform 180ms ease',
      }}
    >
      <Actions
        items={actionItems}
        variant="borderless"
      />
      {/* Hidden audio element for TTS playback */}
      {showTTS && <audio ref={audioRef} style={{ display: 'none' }} />}
    </div>
  )
})

MessageActionsFooter.displayName = 'MessageActionsFooter'

export default MessageActionsFooter
