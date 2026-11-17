import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { AudioLines, Mic } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  ChatComposer,
  type ChatComposerRef,
} from '@/components/chat/chat-composer'
import { PromptInputButton } from '@/components/patterns/chat/prompt-input'
import { useSearchDictation } from '../hooks/use-search-dictation'
// The search question is the page's hero: the tide ring while it has focus.
import '@/components/patterns/chat/tide-composer.css'

interface SearchComposerProps {
  onSearch: (query: string) => void | boolean
  onStop: () => void
  isSearching: boolean
  placeholder?: string
  variant?: 'hero' | 'dock'
  /** Kept for existing callers; the app's configured knowledge bases own scope. */
  enableSemanticMode?: boolean
  prefillText?: string
  prefillVersion?: number
  value?: string
  onValueChange?: (value: string) => void
}

function SearchComposer({
  onSearch,
  onStop,
  isSearching,
  placeholder,
  variant = 'dock',
  prefillText,
  prefillVersion,
  value: controlled,
  onValueChange,
}: SearchComposerProps) {
  const { t } = useTranslation()
  const composer = useRef<ChatComposerRef>(null)
  const [draft, setDraft] = useState('')
  const value = controlled ?? draft
  const update = useCallback(
    (next: string) => {
      setDraft(next)
      onValueChange?.(next)
    },
    [onValueChange],
  )
  const appendTranscript = useCallback(
    (transcript: string) =>
      update(value.trim() ? `${value} ${transcript}` : transcript),
    [update, value],
  )
  const dictation = useSearchDictation(appendTranscript)
  const [previousPrefill, setPreviousPrefill] = useState(prefillVersion)
  if (previousPrefill !== prefillVersion) {
    setPreviousPrefill(prefillVersion)
    if (controlled === undefined && prefillText) setDraft(prefillText)
  }
  useEffect(() => {
    if (prefillVersion && !isSearching) composer.current?.focus()
  }, [prefillVersion, isSearching])
  const submit = (message: string) => {
    if (isSearching || !message.trim()) return
    // A refused search keeps the question for another try.
    if (onSearch(message.trim()) !== false) update('')
  }
  return (
    <ChatComposer
      ref={composer}
      className={`tide-composer search-composer search-composer-${variant}`}
      value={value}
      onChange={update}
      onSubmit={submit}
      placeholder={placeholder ?? t('searchPage.workspace.placeholder')}
      state={
        isSearching ? { kind: 'running', stop: onStop } : { kind: 'ready' }
      }
      autoSize={{ minRows: variant === 'hero' ? 2 : 1, maxRows: 7 }}
      labels={{
        submit: t('searchPage.workspace.sendHint'),
        stop: t('searchPage.workspace.stop'),
      }}
      slots={{
        leading: (
          <PromptInputButton
            iconOnly
            pressed={dictation.recording}
            aria-label={t(
              dictation.recording
                ? 'searchPage.workspace.stopRecording'
                : 'searchPage.workspace.speech',
            )}
            onClick={dictation.recording ? dictation.stop : dictation.start}
          >
            {dictation.recording ? (
              <AudioLines aria-hidden="true" />
            ) : (
              <Mic aria-hidden="true" />
            )}
          </PromptInputButton>
        ),
        hint: `${t(
          dictation.recording
            ? 'searchPage.workspace.recording'
            : 'searchPage.workspace.inputHint',
        )} · ${t('searchPage.workspace.sendHint')}`,
      }}
    />
  )
}

export default memo(SearchComposer)
