/** One response and one audio timeline. Pausing never appends a second response. */
let pauseActivePlayback: (() => void) | null = null

interface PlaybackEvents {
  onPlaying: () => void
  onPause: () => void
  onEnd: () => void
  onError: (error: Error) => void
}

function waitForMediaEvent(
  target: EventTarget,
  event: string,
  signal: AbortSignal,
  action?: () => void,
): Promise<void> {
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      target.removeEventListener(event, success)
      target.removeEventListener('error', failure)
      signal.removeEventListener('abort', abort)
    }
    const success = () => {
      cleanup()
      resolve()
    }
    const failure = () => {
      cleanup()
      reject(new Error('Audio decoding failed'))
    }
    const abort = () => {
      cleanup()
      reject(signal.reason)
    }
    target.addEventListener(event, success, { once: true })
    target.addEventListener('error', failure, { once: true })
    signal.addEventListener('abort', abort, { once: true })
    try {
      action?.()
    } catch (error) {
      cleanup()
      reject(error)
    }
  })
}

export class SpeechPlayback {
  private wantsPlayback = false
  private disposed = false
  private ready = false
  private playPending = false
  private playEpoch = 0
  private objectUrl: string | null = null

  constructor(
    private readonly audio: HTMLAudioElement,
    private readonly events: PlaybackEvents,
  ) {
    audio.addEventListener('playing', this.onPlaying)
    audio.addEventListener('ended', this.onEnded)
    audio.addEventListener('error', this.onError)
  }

  get paused(): boolean {
    return !this.wantsPlayback
  }

  private onPlaying = () => {
    if (!this.wantsPlayback || this.disposed) this.audio.pause()
    else this.events.onPlaying()
  }
  private onEnded = () => {
    this.wantsPlayback = false
    if (pauseActivePlayback === this.pause) pauseActivePlayback = null
    this.events.onEnd()
  }
  private onError = () =>
    this.events.onError(new Error('Audio playback failed'))

  private playWhenReady(): void {
    if (
      !this.ready ||
      !this.wantsPlayback ||
      this.disposed ||
      this.playPending ||
      !this.audio.paused
    )
      return
    this.playPending = true
    const epoch = this.playEpoch
    // play() may need more audio; awaiting it here would block the append loop.
    void this.audio
      .play()
      .catch((error: unknown) => {
        if (!this.disposed && this.wantsPlayback && epoch === this.playEpoch)
          this.events.onError(
            error instanceof Error ? error : new Error('Audio playback failed'),
          )
      })
      .finally(() => {
        this.playPending = false
        if (epoch !== this.playEpoch) this.playWhenReady()
      })
  }

  resume(): void {
    if (this.disposed) return
    if (pauseActivePlayback !== this.pause) pauseActivePlayback?.()
    pauseActivePlayback = this.pause
    this.wantsPlayback = true
    if (this.audio.ended) this.audio.currentTime = 0
    this.playWhenReady()
  }

  pause = (): void => {
    if (this.disposed) return
    this.wantsPlayback = false
    this.playEpoch += 1
    this.audio.pause()
    this.events.onPause()
  }

  async load(response: Response, signal: AbortSignal): Promise<void> {
    const mime = response.headers.get('content-type')?.split(';')[0] || ''
    if (!response.ok || !mime.startsWith('audio/') || !response.body)
      throw new Error('Expected an audio response')
    signal.throwIfAborted()
    const reader = response.body.getReader()
    const cancel = () => {
      void reader.cancel().catch(() => undefined)
    }
    signal.addEventListener('abort', cancel, { once: true })
    try {
      if (
        typeof MediaSource !== 'undefined' &&
        MediaSource.isTypeSupported(mime)
      ) {
        const source = new MediaSource()
        this.objectUrl = URL.createObjectURL(source)
        await waitForMediaEvent(source, 'sourceopen', signal, () => {
          this.audio.src = this.objectUrl!
        })
        const buffer = source.addSourceBuffer(mime)
        let received = false
        while (true) {
          const { done, value } = await reader.read()
          signal.throwIfAborted()
          if (done) break
          received = true
          await waitForMediaEvent(buffer, 'updateend', signal, () =>
            buffer.appendBuffer(new Uint8Array(value).buffer),
          )
          this.ready = true
          this.playWhenReady()
        }
        if (!received) throw new Error('Empty audio response')
        if (source.readyState === 'open') source.endOfStream()
      } else {
        // Keep native decoding available when MP3 MediaSource is unsupported.
        const chunks: ArrayBuffer[] = []
        while (true) {
          const { done, value } = await reader.read()
          signal.throwIfAborted()
          if (done) break
          chunks.push(new Uint8Array(value).buffer)
        }
        if (!chunks.length) throw new Error('Empty audio response')
        this.objectUrl = URL.createObjectURL(new Blob(chunks, { type: mime }))
        this.audio.src = this.objectUrl
        this.ready = true
        this.playWhenReady()
      }
    } catch (error) {
      await reader.cancel().catch(() => undefined)
      throw error
    } finally {
      signal.removeEventListener('abort', cancel)
      reader.releaseLock()
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.wantsPlayback = false
    if (pauseActivePlayback === this.pause) pauseActivePlayback = null
    this.audio.removeEventListener('playing', this.onPlaying)
    this.audio.removeEventListener('ended', this.onEnded)
    this.audio.removeEventListener('error', this.onError)
    this.audio.pause()
    this.audio.removeAttribute('src')
    this.audio.load()
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl)
  }
}
