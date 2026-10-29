import { useRef, useState, useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { conversationAPI } from '@/api/conversation'
import { assertResponse } from '@/lib/streaming'
import { SpeechPlayback } from '@/lib/speech-playback'
import { toast } from '@/lib/toast'

export interface UseSpeechOptions {
  onPlay?: () => void
  onPause?: () => void
  onEnd?: () => void
  onError?: (error: Error) => void
}

export interface UseSpeechReturn {
  audioRef: React.RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  isPaused: boolean
  isLoading: boolean
  handleTogglePlay: () => void
  handleStop: () => void
}

interface SpeechSession {
  controller: AbortController
  playback: SpeechPlayback
}

type SpeechStatus = 'idle' | 'loading' | 'playing' | 'paused'

/** Pause/resume/replay share one response; replacement owns cancellation. */
export function useSpeech(
  content: string,
  options: UseSpeechOptions = {},
): UseSpeechReturn {
  const { t } = useTranslation()
  const audioRef = useRef<HTMLAudioElement>(null)
  const sessionRef = useRef<SpeechSession | null>(null)
  const callbacksRef = useRef(options)
  const [state, setState] = useState<{ content: string; status: SpeechStatus }>(
    { content, status: 'idle' },
  )
  const status = state.content === content ? state.status : 'idle'
  const setStatus = useCallback(
    (next: SpeechStatus) => setState({ content, status: next }),
    [content],
  )

  useEffect(() => {
    callbacksRef.current = options
  }, [options])

  const release = useCallback(() => {
    const session = sessionRef.current
    sessionRef.current = null
    session?.controller.abort()
    session?.playback.dispose()
  }, [])

  useEffect(() => release, [content, release])

  const handleStop = useCallback(() => {
    release()
    setStatus('idle')
  }, [release, setStatus])

  const handleTogglePlay = useCallback(() => {
    const existing = sessionRef.current
    if (existing) {
      if (existing.playback.paused) {
        setStatus('loading')
        existing.playback.resume()
      } else existing.playback.pause()
      return
    }
    if (!content.trim() || !audioRef.current) return

    const controller = new AbortController()
    const ownsSession = () => sessionRef.current?.controller === controller
    const fail = (error: unknown) => {
      if (!ownsSession() || controller.signal.aborted) return
      release()
      setStatus('idle')
      toast.error(t('chat.actions.speechFailed'))
      callbacksRef.current.onError?.(
        error instanceof Error ? error : new Error('Audio playback failed'),
      )
    }
    const playback = new SpeechPlayback(audioRef.current, {
      onPlaying: () => {
        if (!ownsSession()) return
        setStatus('playing')
        callbacksRef.current.onPlay?.()
      },
      onPause: () => {
        if (!ownsSession()) return
        setStatus('paused')
        callbacksRef.current.onPause?.()
      },
      onEnd: () => {
        if (!ownsSession()) return
        setStatus('idle')
        callbacksRef.current.onEnd?.()
      },
      onError: fail,
    })
    // Claim before init/fetch so rapid clicks cannot start duplicate requests.
    sessionRef.current = { controller, playback }
    setStatus('loading')
    playback.resume()
    void (async () => {
      const response = await conversationAPI.textToSpeechStream(content, {
        signal: controller.signal,
      })
      if (!ownsSession()) {
        await response.body?.cancel()
        return
      }
      await assertResponse(response)
      if (!ownsSession()) {
        await response.body?.cancel()
        return
      }
      await playback.load(response, controller.signal)
    })().catch(fail)
  }, [content, release, setStatus, t])

  return {
    audioRef,
    isPlaying: status === 'playing',
    isPaused: status === 'paused',
    isLoading: status === 'loading',
    handleTogglePlay,
    handleStop,
  }
}

export default useSpeech
