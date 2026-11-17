/**
 * Prompt input, adapted from Vercel AI Elements `prompt-input.tsx`
 * (https://github.com/vercel/ai-elements), Copyright 2023 Vercel, Inc.,
 * licensed under the Apache License, Version 2.0
 * (http://www.apache.org/licenses/LICENSE-2.0).
 *
 * Modified for this app: no AI SDK types and no local blob attachments (the
 * caller uploads files handed over by paste or drop through `onFiles`); the
 * submit button is the shared send/stop morph; Enter is IME-safe; the
 * textarea grows by rows where CSS `field-sizing` is missing; design tokens
 * instead of shadcn colours.
 */
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'
import {
  COMPOSER_PILL,
  COMPOSER_PILL_IDLE,
  COMPOSER_PILL_ON,
} from '@/components/patterns/chat/composer-pill'
import '@/components/patterns/chat/prompt-input.css'

interface PromptInputContextValue {
  submit: () => void
  addFiles?: (files: FileList) => void
}

const PromptInputContext = createContext<PromptInputContextValue | null>(null)

const usePromptInput = () => {
  const context = useContext(PromptInputContext)
  if (!context)
    throw new Error('PromptInput parts must be used inside <PromptInput>')
  return context
}

export type PromptInputProps = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  'onSubmit'
> & {
  /** Called by Enter in the textarea and by a submit button. */
  onSubmit: () => void
  /**
   * Files pasted into the textarea or dropped on the input. Without it,
   * pasting and dropping files does nothing special.
   */
  onFiles?: (files: FileList) => void
}

/** The input card: one form holding header, textarea and toolbar. */
export function PromptInput({
  onSubmit,
  onFiles,
  className,
  children,
  ...props
}: PromptInputProps) {
  const latest = useRef({ onSubmit, onFiles })
  useLayoutEffect(() => {
    latest.current = { onSubmit, onFiles }
  })
  const context = useMemo<PromptInputContextValue>(
    () => ({
      submit: () => latest.current.onSubmit(),
      addFiles: onFiles
        ? (files) => latest.current.onFiles?.(files)
        : undefined,
    }),
    [onFiles],
  )
  return (
    <PromptInputContext.Provider value={context}>
      <form
        noValidate
        className={cn('prompt-input', className)}
        {...props}
        onSubmit={(event) => {
          event.preventDefault()
          latest.current.onSubmit()
        }}
        onDragOver={(event) => {
          if (onFiles && event.dataTransfer.types.includes('Files'))
            event.preventDefault()
        }}
        onDrop={(event) => {
          if (!onFiles || !event.dataTransfer.files.length) return
          event.preventDefault()
          event.stopPropagation()
          onFiles(event.dataTransfer.files)
        }}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  )
}

/** What a composer exposes to its page: focus and the native textarea. */
export interface PromptInputTextareaHandle {
  focus: () => void
  inputElement: HTMLTextAreaElement | null
}

export type PromptInputTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'onChange' | 'value' | 'rows'
> & {
  value: string
  onChange: (value: string) => void
  minRows?: number
  maxRows?: number
}

const isComposingKey = (event: KeyboardEvent<HTMLTextAreaElement>) =>
  event.nativeEvent.isComposing ||
  event.keyCode === 229 ||
  event.key === 'Process'

/**
 * The draft. Enter submits; Shift, Ctrl, Alt or Meta with Enter, and Enter
 * while an input method is composing, are left to the editor. Grows with
 * its content between `minRows` and `maxRows`.
 */
export const PromptInputTextarea = forwardRef<
  PromptInputTextareaHandle,
  PromptInputTextareaProps
>(function PromptInputTextarea(
  {
    value,
    onChange,
    minRows = 2,
    maxRows = 7,
    className,
    onKeyDown,
    onPaste,
    onCompositionStart,
    onCompositionEnd,
    style,
    ...props
  },
  ref,
) {
  const { submit, addFiles } = usePromptInput()
  const element = useRef<HTMLTextAreaElement>(null)
  const composing = useRef(false)
  useImperativeHandle(
    ref,
    () => ({
      focus: () => element.current?.focus({ preventScroll: true }),
      get inputElement() {
        return element.current
      },
    }),
    [],
  )

  const resize = useCallback(() => {
    const textarea = element.current
    if (!textarea) return
    const styles = getComputedStyle(textarea)
    const line =
      Number.parseFloat(styles.lineHeight) ||
      (Number.parseFloat(styles.fontSize) || 16) * 1.5
    const padding =
      (Number.parseFloat(styles.paddingTop) || 0) +
      (Number.parseFloat(styles.paddingBottom) || 0)
    const min = line * minRows + padding
    const max = line * maxRows + padding
    textarea.style.height = 'auto'
    const height = Math.min(Math.max(textarea.scrollHeight, min), max)
    textarea.style.height = `${height}px`
    textarea.style.overflowY = textarea.scrollHeight > max ? 'auto' : 'hidden'
  }, [maxRows, minRows])

  useLayoutEffect(resize, [resize, value])

  return (
    <textarea
      ref={element}
      rows={minRows}
      value={value}
      className={cn('prompt-input-textarea', className)}
      style={style}
      {...props}
      onChange={(event) => onChange(event.target.value)}
      onCompositionStart={(event) => {
        composing.current = true
        onCompositionStart?.(event)
      }}
      onCompositionEnd={(event) => {
        composing.current = false
        onCompositionEnd?.(event)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || event.key !== 'Enter') return
        if (composing.current || isComposingKey(event)) return
        if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)
          return
        event.preventDefault()
        submit()
      }}
      onPaste={(event) => {
        onPaste?.(event)
        const files = event.clipboardData?.files
        if (event.defaultPrevented || !addFiles || !files?.length) return
        event.preventDefault()
        addFiles(files)
      }}
    />
  )
})

/** Above the draft: context chips, the attachment tray. */
export function PromptInputHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('prompt-input-header', className)} {...props} />
}

/** Under the draft: tools on the start side, configuration and send at the end. */
export function PromptInputFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('prompt-input-footer', className)} {...props} />
}

export function PromptInputTools({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative flex min-w-0 flex-1 items-center gap-space-2xs',
        className,
      )}
      {...props}
    />
  )
}

/** A toolbar pill: a plain action, or a toggle with `pressed`. */
export const PromptInputButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    pressed?: boolean
    /** Icon only: a round pill as wide as it is tall. */
    iconOnly?: boolean
  }
>(function PromptInputButton(
  { pressed, iconOnly = false, className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={pressed}
      data-state={pressed ? 'on' : 'off'}
      className={cn(
        COMPOSER_PILL,
        pressed ? COMPOSER_PILL_ON : COMPOSER_PILL_IDLE,
        !iconOnly && 'px-space-base',
        className,
      )}
      {...props}
    />
  )
})
