/**
 * 消息操作按钮：复制、TTS 朗读、重新生成、点赞/踩。
 * 每条消息各有一个实例（useSpeech 按消息朗读）。
 */
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Copy,
  LoaderCircle,
  Pause,
  RotateCcw,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from 'lucide-react'
import { MessageAction } from '@/components/patterns/chat/message'
import { useSpeech } from '@/hooks/use-speech'
import { cn } from '@/lib/utils'

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

type Feedback = 'like' | 'dislike' | null

export const MessageActionsFooter: React.FC<MessageActionsFooterProps> =
  React.memo(
    ({
      content,
      onCopy,
      onRegenerate,
      onLike,
      onDislike,
      showRegenerate = true,
      showFeedback = true,
      showTTS = true,
      className,
    }) => {
      const { t } = useTranslation()
      const { isPlaying, isPaused, isLoading, handleTogglePlay, audioRef } =
        useSpeech(content)
      const [feedback, setFeedback] = React.useState<Feedback>(null)
      const speechLabel = t(
        isPlaying || isLoading
          ? 'chat.actions.pauseSpeech'
          : isPaused
            ? 'chat.actions.resumeSpeech'
            : 'chat.actions.readAloud',
      )
      const choose = (value: Exclude<Feedback, null>) => {
        const next = feedback === value ? null : value
        setFeedback(next)
        if (next === 'like') onLike?.()
        if (next === 'dislike') onDislike?.()
      }
      return (
        <div
          className={cn(
            'flex items-center gap-space-2xs',
            className ?? 'mt-space-sm',
          )}
          data-message-actions-footer
        >
          <MessageAction label={t('common.copy')} onClick={onCopy}>
            <Copy aria-hidden="true" className="size-icon-sm" />
          </MessageAction>
          {showTTS && (
            <MessageAction
              label={speechLabel}
              aria-pressed={isPlaying || isLoading}
              onClick={handleTogglePlay}
            >
              {isLoading ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="size-icon-sm animate-spin motion-reduce:animate-none"
                />
              ) : isPlaying ? (
                <Pause aria-hidden="true" className="size-icon-sm" />
              ) : (
                <Volume2 aria-hidden="true" className="size-icon-sm" />
              )}
            </MessageAction>
          )}
          {showRegenerate && onRegenerate && (
            <MessageAction
              label={t('chat.actions.regenerate')}
              onClick={onRegenerate}
            >
              <RotateCcw aria-hidden="true" className="size-icon-sm" />
            </MessageAction>
          )}
          {showFeedback && (onLike || onDislike) && (
            <>
              <MessageAction
                label={t('chat.actions.like')}
                aria-pressed={feedback === 'like'}
                onClick={() => choose('like')}
              >
                <ThumbsUp aria-hidden="true" className="size-icon-sm" />
              </MessageAction>
              <MessageAction
                label={t('chat.actions.dislike')}
                aria-pressed={feedback === 'dislike'}
                onClick={() => choose('dislike')}
              >
                <ThumbsDown aria-hidden="true" className="size-icon-sm" />
              </MessageAction>
            </>
          )}
          {/* Hidden audio element for TTS playback */}
          {showTTS && <audio ref={audioRef} hidden />}
        </div>
      )
    },
  )

MessageActionsFooter.displayName = 'MessageActionsFooter'

export default MessageActionsFooter
