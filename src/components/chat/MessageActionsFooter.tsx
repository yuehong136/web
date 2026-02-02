/**
 * 消息操作按钮组件
 * 用于显示消息底部的操作按钮，包括复制、TTS 朗读、重新生成、点赞/踩
 * 
 * 由于使用了 useSpeech hook，每条消息需要创建独立的组件实例
 */
import React from 'react'
import { 
  Copy, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown,
  Volume2,
  Pause,
  Loader2
} from 'lucide-react'
import { Actions } from '@ant-design/x'
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

  // 构建操作项列表
  const actionItems = React.useMemo(() => {
    const items: Array<{
      key: string
      label: string
      icon: React.ReactNode
    }> = [
      {
        key: 'copy',
        label: '复制',
        icon: <Copy className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
      }
    ]

    if (showTTS) {
      items.push({
        key: 'tts',
        label: isPlaying ? '暂停' : '朗读',
        icon: isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" style={{ color: 'var(--color-text-accent)' }} />
        ) : isPlaying ? (
          <Pause className="h-3 w-3" style={{ color: 'var(--color-text-accent)' }} />
        ) : (
          <Volume2 className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
        )
      })
    }

    if (showRegenerate && onRegenerate) {
      items.push({
        key: 'regenerate',
        label: '重新生成',
        icon: <RotateCcw className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
      })
    }

    if (showFeedback) {
      if (onLike) {
        items.push({
          key: 'like',
          label: '点赞',
          icon: <ThumbsUp className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
        })
      }
      if (onDislike) {
        items.push({
          key: 'dislike',
          label: '踩',
          icon: <ThumbsDown className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
        })
      }
    }

    return items
  }, [isPlaying, isLoading, showTTS, showRegenerate, showFeedback, onRegenerate, onLike, onDislike])

  const handleAction = React.useCallback((key: string) => {
    switch (key) {
      case 'copy':
        onCopy()
        break
      case 'tts':
        handleTogglePlay()
        break
      case 'regenerate':
        onRegenerate?.()
        break
      case 'like':
        onLike?.()
        break
      case 'dislike':
        onDislike?.()
        break
    }
  }, [onCopy, handleTogglePlay, onRegenerate, onLike, onDislike])

  return (
    <div className={className || "mt-2 flex justify-end"}>
      <Actions
        items={actionItems}
        variant="borderless"
        onClick={({ key }) => handleAction(key)}
      />
      {/* Hidden audio element for TTS playback */}
      {showTTS && <audio ref={audioRef} style={{ display: 'none' }} />}
    </div>
  )
})

MessageActionsFooter.displayName = 'MessageActionsFooter'

export default MessageActionsFooter
