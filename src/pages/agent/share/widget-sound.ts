import { useEffect, useRef } from 'react'

export function playWidgetSound(muted: boolean, frequency = 800) {
  if (muted || typeof window.AudioContext !== 'function') return
  let context: AudioContext | undefined
  try {
    context = new window.AudioContext()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.2, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2)
    oscillator.onended = () => {
      void context?.close().catch(() => undefined)
    }
    oscillator.start()
    oscillator.stop(context.currentTime + 0.2)
  } catch {
    // Audio is optional (for example, the browser may block it before user activation).
    void context?.close().catch(() => undefined)
  }
}

export function useWidgetResponseSound(
  running: boolean,
  muted: boolean,
  hasResponse: boolean,
) {
  const wasRunning = useRef(false)
  useEffect(() => {
    if (wasRunning.current && !running && hasResponse)
      playWidgetSound(muted, 600)
    wasRunning.current = running
  }, [running, muted, hasResponse])
}
