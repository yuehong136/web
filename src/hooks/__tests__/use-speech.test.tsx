// @vitest-environment jsdom
import React, { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi, type Mock } from 'vitest'
import { useSpeech, type UseSpeechReturn } from '../use-speech'
import { conversationAPI } from '@/api/conversation'
import { toast } from '@/lib/toast'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))
vi.mock('@/lib/toast', () => ({ toast: { error: vi.fn() } }))

class AudioBufferStub extends EventTarget {
  chunks: number[][] = []
  appendBuffer(bytes: ArrayBuffer) {
    this.chunks.push(Array.from(new Uint8Array(bytes)))
    queueMicrotask(() => this.dispatchEvent(new Event('updateend')))
  }
}
class MediaSourceStub extends EventTarget {
  static instances: MediaSourceStub[] = []
  static isTypeSupported = () => true
  readyState = 'open'
  buffer = new AudioBufferStub()
  constructor() {
    super()
    MediaSourceStub.instances.push(this)
  }
  addSourceBuffer() {
    return this.buffer
  }
  endOfStream() {
    this.readyState = 'ended'
  }
}

let root: Root
let container: HTMLDivElement
let speech: UseSpeechReturn
let other: UseSpeechReturn
let playing: WeakSet<HTMLMediaElement>
let ended: WeakSet<HTMLMediaElement>
let cancelled: Mock<() => void>
let stream: ReadableStreamDefaultController<Uint8Array>
let revoke: Mock<(url: string) => void>
let onEnd: Mock<() => void>

function Probe({
  content = 'First answer',
  second = false,
}: {
  content?: string
  second?: boolean
}) {
  const { audioRef: primaryAudioRef, ...primary } = useSpeech(content, {
    onEnd,
  })
  const { audioRef: secondaryAudioRef, ...secondary } =
    useSpeech('Second answer')
  useEffect(() => {
    speech = { ...primary, audioRef: primaryAudioRef }
    other = { ...secondary, audioRef: secondaryAudioRef }
  })
  return (
    <>
      <audio ref={primaryAudioRef} />
      {second && <audio ref={secondaryAudioRef} />}
    </>
  )
}
const response = () =>
  new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        stream = controller
      },
      cancel() {
        cancelled()
      },
    }),
    { headers: { 'content-type': 'audio/mpeg' } },
  )
const emit = async (bytes: number[]) =>
  act(async () => {
    stream.enqueue(new Uint8Array(bytes))
  })
const toggle = async () => act(async () => speech.handleTogglePlay())

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  playing = new WeakSet()
  ended = new WeakSet()
  cancelled = vi.fn()
  onEnd = vi.fn()
  revoke = vi.fn()
  MediaSourceStub.instances = []
  vi.stubGlobal('MediaSource', MediaSourceStub)
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn((source: unknown) => {
      if (source instanceof MediaSourceStub)
        queueMicrotask(() => source.dispatchEvent(new Event('sourceopen')))
      return `blob:audio-${MediaSourceStub.instances.length}`
    }),
    revokeObjectURL: revoke,
  })
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(
    function (this: HTMLMediaElement) {
      return !playing.has(this)
    },
  )
  vi.spyOn(HTMLMediaElement.prototype, 'ended', 'get').mockImplementation(
    function (this: HTMLMediaElement) {
      return ended.has(this)
    },
  )
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    playing.add(this)
    ended.delete(this)
    this.dispatchEvent(new Event('playing'))
    return Promise.resolve()
  })
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    playing.delete(this)
  })
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(
    () => undefined,
  )
  vi.spyOn(conversationAPI, 'textToSpeechStream').mockImplementation(async () =>
    response(),
  )
  container = document.createElement('div')
  root = createRoot(container)
  await act(async () => root.render(<Probe />))
})
afterEach(async () => {
  await act(async () => root.unmount())
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

it('pauses across incoming chunks and resumes at the same position without another request', async () => {
  await toggle()
  await emit([1, 2])
  expect(speech.isPlaying).toBe(true)
  speech.audioRef.current!.currentTime = 7
  await toggle()
  await emit([3, 4])
  expect(speech.audioRef.current?.paused).toBe(true)
  expect(speech.isPlaying).toBe(false)
  await toggle()
  expect(speech.audioRef.current?.currentTime).toBe(7)
  expect(speech.isPlaying).toBe(true)
  expect(conversationAPI.textToSpeechStream).toHaveBeenCalledTimes(1)
  expect(MediaSourceStub.instances[0].buffer.chunks).toEqual([
    [1, 2],
    [3, 4],
  ])
})

it('claims loading synchronously so rapid clicks never create duplicate synthesis requests', async () => {
  await act(async () => {
    speech.handleTogglePlay()
    speech.handleTogglePlay()
    speech.handleTogglePlay()
  })
  await emit([1])
  expect(conversationAPI.textToSpeechStream).toHaveBeenCalledTimes(1)
  expect(speech.isPlaying).toBe(true)
})

it('pausing before response headers arrive keeps late audio paused', async () => {
  let resolve!: (value: Response) => void
  vi.mocked(conversationAPI.textToSpeechStream).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done
    }),
  )
  await toggle()
  await toggle()
  await act(async () => resolve(response()))
  await emit([1])
  expect(speech.isPlaying).toBe(false)
  expect(speech.audioRef.current?.paused).toBe(true)
})

it('an interrupted play promise cannot fail a newer resume attempt', async () => {
  let rejectPlay!: (error: Error) => void
  vi.mocked(HTMLMediaElement.prototype.play).mockImplementationOnce(
    () =>
      new Promise((_resolve, reject) => {
        rejectPlay = reject
      }),
  )
  await toggle()
  await emit([1])
  await toggle()
  await toggle()
  await act(async () =>
    rejectPlay(new DOMException('Interrupted by pause', 'AbortError')),
  )
  expect(speech.isPlaying).toBe(true)
  expect(toast.error).not.toHaveBeenCalled()
  expect(conversationAPI.textToSpeechStream).toHaveBeenCalledTimes(1)
})

it('replays completed audio from the beginning without appending a duplicate response', async () => {
  await toggle()
  await emit([1])
  await act(async () => stream.close())
  const audio = speech.audioRef.current!
  audio.currentTime = 12
  await act(async () => {
    ended.add(audio)
    playing.delete(audio)
    audio.dispatchEvent(new Event('ended'))
  })
  expect(onEnd).toHaveBeenCalledTimes(1)
  expect(speech.isPlaying).toBe(false)
  await toggle()
  expect(audio.currentTime).toBe(0)
  expect(conversationAPI.textToSpeechStream).toHaveBeenCalledTimes(1)
  expect(MediaSourceStub.instances[0].buffer.chunks).toEqual([[1]])
})

it('starting another message pauses the previous voice', async () => {
  await act(async () => root.render(<Probe second />))
  await toggle()
  await emit([1])
  const firstAudio = speech.audioRef.current!
  await act(async () => other.handleTogglePlay())
  await emit([2])
  expect(firstAudio.paused).toBe(true)
  expect(speech.isPlaying).toBe(false)
  expect(other.isPlaying).toBe(true)
})

it('stop aborts the response, clears buffers, and allows a fresh playback session', async () => {
  await toggle()
  await emit([1])
  const signal = vi.mocked(conversationAPI.textToSpeechStream).mock.calls[0][1]
    ?.signal
  await act(async () => speech.handleStop())
  expect(signal?.aborted).toBe(true)
  expect(cancelled).toHaveBeenCalledTimes(1)
  expect(revoke).toHaveBeenCalledTimes(1)
  expect(speech.audioRef.current?.getAttribute('src')).toBeNull()
  await toggle()
  await emit([2])
  expect(conversationAPI.textToSpeechStream).toHaveBeenCalledTimes(2)
  expect(MediaSourceStub.instances[1].buffer.chunks).toEqual([[2]])
})

it('replacing content aborts the old request and ignores a late response', async () => {
  let resolve!: (value: Response) => void
  vi.mocked(conversationAPI.textToSpeechStream).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done
    }),
  )
  await toggle()
  const signal = vi.mocked(conversationAPI.textToSpeechStream).mock.calls[0][1]
    ?.signal
  await act(async () => root.render(<Probe content="New answer" />))
  expect(signal?.aborted).toBe(true)
  await act(async () => resolve(response()))
  expect(cancelled).toHaveBeenCalledTimes(1)
  expect(MediaSourceStub.instances).toHaveLength(0)
  expect(toast.error).not.toHaveBeenCalled()
})

it('unmount cancels the open reader and does not leave audio playing', async () => {
  await toggle()
  await emit([1])
  const audio = speech.audioRef.current!
  await act(async () => root.render(<></>))
  expect(cancelled).toHaveBeenCalledTimes(1)
  expect(audio.paused).toBe(true)
  expect(revoke).toHaveBeenCalledTimes(1)
})

it('rejects JSON error responses and retries in a clean session', async () => {
  vi.mocked(conversationAPI.textToSpeechStream).mockResolvedValueOnce(
    new Response(JSON.stringify({ retcode: 500, retmsg: 'provider detail' }), {
      headers: { 'content-type': 'application/json' },
    }),
  )
  await toggle()
  expect(toast.error).toHaveBeenCalledWith('chat.actions.speechFailed')
  expect(speech.isLoading).toBe(false)
  await toggle()
  await emit([1])
  expect(speech.isPlaying).toBe(true)
})

it('falls back to native file decoding when streaming MP3 is unsupported', async () => {
  vi.stubGlobal('MediaSource', undefined)
  await toggle()
  await emit([1, 2])
  expect(speech.isPlaying).toBe(false)
  await act(async () => stream.close())
  expect(speech.isPlaying).toBe(true)
  await toggle()
  await toggle()
  expect(conversationAPI.textToSpeechStream).toHaveBeenCalledTimes(1)
})
