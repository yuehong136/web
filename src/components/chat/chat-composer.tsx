import { forwardRef, useRef, type ReactNode } from 'react'
import type { SenderProps, SenderRef } from '@ant-design/x/es/sender/interface'
import { ArrowUp, Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppChatComposer } from './app-chat-composer'
import { Button } from '@/components/ui/button'
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
  hint?: ReactNode
}

export interface ChatComposerProps {
  value: string
  onChange: NonNullable<SenderProps['onChange']>
  onSubmit: (value: string) => void
  state: ComposerState
  placeholder: string
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
    const canSubmit = state.kind === 'ready' && Boolean(value.trim())
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
              <div className="relative flex min-w-0 flex-1 items-center gap-space-sm">
                {slots?.leading}
              </div>
              <div className="flex min-w-0 items-center gap-space-sm">
                {slots?.configuration}
                {state.kind === 'running' ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={state.stop}
                    aria-label={labels?.stop ?? t('chat.stream.stop')}
                    title={labels?.stop ?? t('chat.stream.stop')}
                  >
                    <Square className="size-icon-sm" aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="icon"
                    disabled={!canSubmit}
                    onClick={submit}
                    aria-label={labels?.submit ?? t('common.submit')}
                    title={labels?.submit ?? t('common.submit')}
                  >
                    <ArrowUp className="size-icon-sm" aria-hidden="true" />
                  </Button>
                )}
              </div>
            </div>
          }
        />
        <div className="chat-composer-hint">
          {state.kind === 'blocked' && state.reason
            ? state.reason
            : (slots?.hint ?? t('chat.composer.keyboardHint'))}
        </div>
      </div>
    )
  },
)
