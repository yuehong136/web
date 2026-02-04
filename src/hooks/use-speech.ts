/**
 * TTS (Text-to-Speech) Hook
 *
 * Provides text-to-speech functionality using streaming audio playback.
 * Based on ragflow's implementation using openai-speech-stream-player.
 *
 * @example
 * ```tsx
 * const { isPlaying, handleTogglePlay, audioRef } = useSpeech(text);
 *
 * return (
 *   <>
 *     <button onClick={handleTogglePlay}>
 *       {isPlaying ? 'Pause' : 'Play'}
 *     </button>
 *     <audio ref={audioRef} />
 *   </>
 * );
 * ```
 */
import { useRef, useState, useCallback, useEffect } from 'react'
import { SpeechPlayer } from 'openai-speech-stream-player'
import { conversationAPI } from '@/api/conversation'
import { toast } from '@/lib/toast'

export interface UseSpeechOptions {
  /** Called when playback starts */
  onPlay?: () => void
  /** Called when playback is paused */
  onPause?: () => void
  /** Called when playback ends */
  onEnd?: () => void
  /** Called on error */
  onError?: (error: Error) => void
}

export interface UseSpeechReturn {
  /** Reference to the audio element */
  audioRef: React.RefObject<HTMLAudioElement | null>
  /** Whether audio is currently playing */
  isPlaying: boolean
  /** Whether audio is currently loading */
  isLoading: boolean
  /** Toggle play/pause */
  handleTogglePlay: () => void
  /** Stop playback and reset */
  handleStop: () => void
}

/**
 * Hook for text-to-speech functionality with streaming audio playback.
 *
 * @param content - Text content to convert to speech
 * @param options - Optional callbacks for playback events
 * @returns Speech control functions and state
 */
export function useSpeech(
  content: string,
  options: UseSpeechOptions = {}
): UseSpeechReturn {
  const { onPlay, onPause, onEnd, onError } = options

  const audioRef = useRef<HTMLAudioElement>(null)
  const playerRef = useRef<SpeechPlayer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize the speech player
  const initPlayer = useCallback(async () => {
    if (isInitialized || !audioRef.current) return

    try {
      const player = new SpeechPlayer({
        audio: audioRef.current,
        // Auto-detect MIME type based on browser support
        mimeType: MediaSource.isTypeSupported('audio/mpeg')
          ? 'audio/mpeg'
          : 'audio/mp4; codecs="mp4a.40.2"', // Firefox fallback
        onPlaying: () => {
          setIsPlaying(true)
          setIsLoading(false)
          onPlay?.()
        },
        onPause: () => {
          setIsPlaying(false)
          onPause?.()
        },
      } as any)

      await player.init()
      playerRef.current = player
      setIsInitialized(true)
    } catch (error) {
      console.error('Failed to initialize speech player:', error)
      onError?.(error as Error)
    }
  }, [isInitialized, onPlay, onPause, onEnd, onError])

  // Start speech playback
  const startSpeech = useCallback(async () => {
    if (!content.trim()) {
      toast.error('No text content to read')
      return
    }

    try {
      setIsLoading(true)

      // Initialize player if needed
      if (!playerRef.current) {
        await initPlayer()
      }

      if (!playerRef.current) {
        throw new Error('Failed to initialize player')
      }

      // Fetch and stream the audio
      const response = await conversationAPI.textToSpeechStream(content)

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`)
      }

      // Feed the response to the player for streaming playback
      await playerRef.current.feedWithResponse(response)
    } catch (error) {
      console.error('TTS error:', error)
      setIsLoading(false)
      setIsPlaying(false)
      toast.error('Failed to play audio')
      onError?.(error as Error)
    }
  }, [content, initPlayer, onError])

  // Pause playback
  const pauseSpeech = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  // Toggle play/pause
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      pauseSpeech()
    } else {
      startSpeech()
    }
  }, [isPlaying, pauseSpeech, startSpeech])

  // Stop and reset
  const handleStop = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause()
      setIsPlaying(false)
      setIsLoading(false)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.pause()
      }
    }
  }, [])

  return {
    audioRef,
    isPlaying,
    isLoading,
    handleTogglePlay,
    handleStop,
  }
}

export default useSpeech
