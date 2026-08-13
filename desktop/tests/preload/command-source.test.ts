import assert from 'node:assert/strict'
import test from 'node:test'
import type { IpcRenderer, IpcRendererEvent } from 'electron'
import { createDesktopCommandSource } from '../../electron/preload/command-source'
import {
  DESKTOP_COMMAND_INVOKED_CHANNEL,
  DesktopCommandId,
} from '../../protocol/renderer-bridge'

type IpcListener = (event: IpcRendererEvent, ...arguments_: unknown[]) => void

class FakeIpcRenderer {
  readonly listeners = new Map<string, Set<IpcListener>>()
  removeCount = 0

  on(channel: string, listener: IpcListener): this {
    const listeners = this.listeners.get(channel) ?? new Set<IpcListener>()
    listeners.add(listener)
    this.listeners.set(channel, listeners)
    return this
  }

  removeListener(channel: string, listener: IpcListener): this {
    this.removeCount += 1
    this.listeners.get(channel)?.delete(listener)
    return this
  }

  emit(channel: string, ...arguments_: unknown[]): void {
    const event = Object.freeze({ marker: 'must-not-leak' })
    for (const listener of this.listeners.get(channel) ?? []) {
      listener(event as unknown as IpcRendererEvent, ...arguments_)
    }
  }
}

test('preload command source forwards only allowlisted ids without the event', () => {
  const ipcRenderer = new FakeIpcRenderer()
  const source = createDesktopCommandSource(
    ipcRenderer as unknown as Pick<IpcRenderer, 'on' | 'removeListener'>,
  )
  const received: unknown[][] = []
  const unsubscribe = source.subscribe((...arguments_) => {
    received.push(arguments_)
  })

  ipcRenderer.emit(
    DESKTOP_COMMAND_INVOKED_CHANNEL,
    DesktopCommandId.PALETTE_OPEN,
  )
  ipcRenderer.emit(DESKTOP_COMMAND_INVOKED_CHANNEL, 'desktop.open-devtools')
  ipcRenderer.emit('untrusted-channel', DesktopCommandId.NAVIGATION_HOME)

  assert.deepEqual(received, [[DesktopCommandId.PALETTE_OPEN]])
  unsubscribe()
  unsubscribe()
  assert.equal(ipcRenderer.removeCount, 1)

  ipcRenderer.emit(
    DESKTOP_COMMAND_INVOKED_CHANNEL,
    DesktopCommandId.NAVIGATION_HOME,
  )
  assert.deepEqual(received, [[DesktopCommandId.PALETTE_OPEN]])
})

test('preload command source is immutable and rejects invalid listeners', () => {
  const ipcRenderer = new FakeIpcRenderer()
  const source = createDesktopCommandSource(
    ipcRenderer as unknown as Pick<IpcRenderer, 'on' | 'removeListener'>,
  )

  assert.equal(Object.isFrozen(source), true)
  assert.throws(
    () =>
      (source.subscribe as unknown as (listener: unknown) => () => void)(
        undefined,
      ),
    TypeError,
  )
})
