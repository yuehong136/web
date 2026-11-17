import { forwardRef, useRef, type ReactNode } from 'react'
import type { SenderProps, SenderRef } from '@ant-design/x/es/sender/interface'
import { useTranslation } from 'react-i18next'
import { AppChatComposer } from './app-chat-composer'
import { ComposerSendButton } from './composer-send-button'
import { cn } from '@/lib/utils'

export type ComposerState =
  | { kind: 'ready' }
  | { kind: 'blocked'; reason?: string }
  | { kind: 'running'; stop: () => void }

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
  onChange: NonNullable<SenderProps['onChange']>
  onSubmit: (value: string) => void
  state: ComposerState
  placeholder: string
  disabled?: boolean
  /** Attachments or task parameters can make an empty text draft sendable. */
  allowEmpty?: boolean
  labels?: { submit?: string; stop?: string }
  slots?: ComposerSlots
  autoSize?: SenderProps['autoSize']
  onPasteFile?: SenderProps['onPasteFile']
  className?: string
}

/** One editable draft, with submission and configuration owned by the caller. */
export const ChatComposer = forwardRef<SenderRef, ChatComposerProps>(
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
      autoSize = { minRows: 2, maxRows: 7 },
      onPasteFile,
      className,
    },
    ref,
  ) {
    const { t } = useTranslation()
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
        <AppChatComposer
          ref={ref}
          aria-label={placeholder}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoSize={autoSize}
          onPasteFile={onPasteFile}
          onSubmit={submit}
          onKeyDown={(event) => {
            if (
              composing.current ||
              event.nativeEvent.isComposing ||
              event.keyCode === 229 ||
              event.key === 'Process'
            )
              return false
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !event.ctrlKey &&
              !event.altKey &&
              !event.metaKey
            ) {
              event.preventDefault()
              submit()
              return false
            }
            return undefined
          }}
          header={
            slots?.context || slots?.attachments ? (
              <div className="chat-composer-context">
                {slots.context}
                {slots.attachments}
              </div>
            ) : undefined
          }
          suffix={false}
          footer={
            <div className="chat-composer-toolbar">
              <div className="relative flex min-w-0 flex-1 items-center gap-space-2xs">
                {slots?.leading}
              </div>
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
            </div>
          }
        />
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
