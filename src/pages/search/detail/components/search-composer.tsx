import './search-composer.css'
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ElementRef,
} from 'react'
import { Sender } from '@ant-design/x'
import { AudioLines, Mic } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useSearchDictation } from '../hooks/use-search-dictation'

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
  const sender = useRef<ElementRef<typeof Sender>>(null)
  const composing = useRef(false)
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
    if (prefillVersion && !isSearching) sender.current?.focus()
  }, [prefillVersion, isSearching])
  const submit = (message: string) => {
    if (composing.current || isSearching || !message.trim()) return
    if (onSearch(message.trim()) !== false) update('')
  }
  return (
    <div
      className={`search-composer search-composer-${variant}`}
      onCompositionStartCapture={() => {
        composing.current = true
      }}
      onCompositionEndCapture={() => {
        composing.current = false
      }}
    >
      <Sender
        ref={sender}
        value={value}
        onChange={update}
        onSubmit={submit}
        onCancel={onStop}
        loading={isSearching}
        submitType="enter"
        autoSize={{ minRows: variant === 'hero' ? 2 : 1, maxRows: 7 }}
        placeholder={placeholder ?? t('searchPage.workspace.placeholder')}
        suffix={(_, { components }) => (
          <div className="flex items-center gap-space-xs">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t(
                dictation.recording
                  ? 'searchPage.workspace.stopRecording'
                  : 'searchPage.workspace.speech',
              )}
              aria-pressed={dictation.recording}
              onClick={dictation.recording ? dictation.stop : dictation.start}
            >
              {dictation.recording ? (
                <AudioLines className="size-icon-sm" />
              ) : (
                <Mic className="size-icon-sm" />
              )}
            </Button>
            {isSearching ? (
              <components.LoadingButton
                aria-label={t('searchPage.workspace.stop')}
              />
            ) : (
              <components.SendButton
                aria-label={t('searchPage.workspace.sendHint')}
              />
            )}
          </div>
        )}
        footer={
          <div className="flex flex-wrap justify-between gap-space-sm text-xs text-text-secondary">
            <span>
              {t(
                dictation.recording
                  ? 'searchPage.workspace.recording'
                  : 'searchPage.workspace.inputHint',
              )}
            </span>
            <span>{t('searchPage.workspace.sendHint')}</span>
          </div>
        }
      />
    </div>
  )
}

export default memo(SearchComposer)
