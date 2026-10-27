import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/lib/toast'

interface RecognitionResult extends Event {
  resultIndex: number
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}
interface Recognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((event: RecognitionResult) => void) | null
  onerror: ((event: Event & { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition
  webkitSpeechRecognition?: new () => Recognition
}

export function useSearchDictation(onTranscript: (transcript: string) => void) {
  const { t, i18n } = useTranslation()
  const [recording, setRecording] = useState(false)
  const recognition = useRef<Recognition | null>(null)
  const latest = useRef({ onTranscript, t })
  useEffect(() => {
    latest.current = { onTranscript, t }
  }, [onTranscript, t])
  useEffect(
    () => () => {
      const current = recognition.current
      if (!current) return
      current.onstart =
        current.onresult =
        current.onerror =
        current.onend =
          null
      current.stop()
      recognition.current = null
    },
    [],
  )
  const stop = useCallback(() => {
    recognition.current?.stop()
    setRecording(false)
  }, [])
  const start = useCallback(() => {
    const browser = window as SpeechWindow
    const Constructor =
      browser.SpeechRecognition ?? browser.webkitSpeechRecognition
    if (!Constructor) {
      toast.error(t('searchPage.workspace.speechUnsupported'))
      return
    }
    if (!recognition.current) {
      const current = new Constructor()
      current.continuous = true
      current.interimResults = false
      current.onstart = () => setRecording(true)
      current.onend = () => setRecording(false)
      current.onresult = (event) => {
        let transcript = ''
        for (
          let index = event.resultIndex;
          index < event.results.length;
          index++
        )
          transcript += event.results[index][0]?.transcript ?? ''
        if (transcript.trim()) latest.current.onTranscript(transcript.trim())
      }
      current.onerror = (event) => {
        setRecording(false)
        toast.error(
          latest.current.t(
            event.error === 'not-allowed'
              ? 'searchPage.workspace.microphoneDenied'
              : 'searchPage.workspace.speechFailed',
          ),
        )
      }
      recognition.current = current
    }
    recognition.current.lang = i18n.resolvedLanguage ?? i18n.language
    try {
      recognition.current.start()
    } catch {
      toast.error(t('searchPage.workspace.speechFailed'))
      setRecording(false)
    }
  }, [i18n, t])
  return { recording, start, stop }
}
