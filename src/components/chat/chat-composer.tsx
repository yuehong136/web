import { forwardRef, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ComposerSendButton } from './composer-send-button'
import {
  PromptInput,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputTextareaHandle,
} from '@/components/patterns/chat/prompt-input'
import { cn } from '@/lib/utils'
import '@/components/chat/chat-composer.css'

export type ComposerState =
  | { kind: 'ready' }
  | { kind: 'blocked'; reason?: string }
  | { kind: 'running'; stop: () => void }

/** Focus and the native textarea (e.g. for the caret position). */
export type ChatComposerRef = PromptInputTextareaHandle

interface ComposerSlots {
  context?: ReactNode
  attachments?: ReactNode
  leading?: ReactNode
  configuration?: ReactNode
  /** Pass false when the surrounding workspace already renders a hint. */
  hint?: ReactNode
}

export interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  state: ComposerState
  placeholder: string
  disabled?: boolean
  /** Attachments or task parameters can make an empty text draft sendable. */
  allowEmpty?: boolean
  labels?: { submit?: string; stop?: string }
  slots?: ComposerSlots
  autoSize?: { minRows?: number; maxRows?: number }
  /** Files pasted into the draft; without it pasting files does nothing. */
  onPasteFile?: (files: FileList) => void
  className?: string
}

/**
 * One editable draft, with submission and configuration owned by the caller.
 * Built on the prompt input pattern (adapted from AI Elements): context and
 * attachments above the draft, tools and the send/stop morph below it.
 */
export const ChatComposer = forwardRef<ChatComposerRef, ChatComposerProps>(
  function ChatComposer(
    {
      value,
      onChange,
      onSubmit,
      state,
      placeholder,
      disabled = false,
      allowEmpty = false,
      labels,
      slots,
      autoSize,
      onPasteFile,
      className,
    },
    ref,
  ) {
    const { t } = useTranslation()
    // While an input method composes, neither Enter nor the button sends.
    const composing = useRef(false)
    const canSubmit =
      !disabled &&
      state.kind === 'ready' &&
      (allowEmpty || Boolean(value.trim()))
    const submit = () => {
      if (canSubmit && !composing.current) onSubmit(value)
    }
    return (
      <div
        className={cn('chat-composer', className)}
        data-composer-state={state.kind}
        onCompositionStartCapture={() => {
          composing.current = true
        }}
        onCompositionEndCapture={() => {
          composing.current = false
        }}
      >
        <PromptInput
          onSubmit={submit}
          onFiles={onPasteFile}
          data-composer-surface
        >
          {(slots?.context || slots?.attachments) && (
            <PromptInputHeader className="chat-composer-context">
              {slots.context}
              {slots.attachments}
            </PromptInputHeader>
          )}
          <PromptInputTextarea
            ref={ref}
            aria-label={placeholder}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            minRows={autoSize?.minRows ?? 2}
            maxRows={autoSize?.maxRows ?? 7}
          />
          <PromptInputFooter className="chat-composer-toolbar">
            <PromptInputTools>{slots?.leading}</PromptInputTools>
            <div className="flex min-w-0 items-center gap-space-xs">
              {slots?.configuration}
              <ComposerSendButton
                running={state.kind === 'running'}
                canSend={canSubmit}
                onSend={submit}
                onStop={() => {
                  if (state.kind === 'running') state.stop()
                }}
                sendLabel={labels?.submit ?? t('common.submit')}
                stopLabel={labels?.stop ?? t('chat.stream.stop')}
                className="rounded-radius-full"
              />
            </div>
          </PromptInputFooter>
        </PromptInput>
        {slots?.hint !== false && (
          <div className="chat-composer-hint">
            {state.kind === 'blocked' && state.reason
              ? state.reason
              : (slots?.hint ?? t('chat.composer.keyboardHint'))}
          </div>
        )}
      </div>
    )
  },
)
