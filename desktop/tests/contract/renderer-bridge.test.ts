import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createDesktopBridge,
  DESKTOP_BRIDGE_VERSION,
  DesktopCommandId,
  getDesktopCapabilities,
  type DesktopCommandListener,
  type DesktopCommandSource,
} from '../../protocol/renderer-bridge'
import { RENDERER_BRIDGE_VERSION } from '../../build/constants.mjs'

function createCommandSource(): DesktopCommandSource & {
  emit(commandId: DesktopCommandId): void
} {
  const listeners = new Set<DesktopCommandListener>()
  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    emit(commandId) {
      for (const listener of listeners) listener(commandId)
    },
  }
}

test('renderer bridge exposes only immutable capabilities and commands', () => {
  const commandSource = createCommandSource()
  const bridge = createDesktopBridge(commandSource)
  const capabilities = bridge.capabilities()

  assert.equal(bridge.version, DESKTOP_BRIDGE_VERSION)
  assert.equal(bridge.version, RENDERER_BRIDGE_VERSION)
  assert.deepEqual(Object.keys(bridge).sort(), [
    'capabilities',
    'commands',
    'version',
  ])
  assert.deepEqual(capabilities, {
    desktop: true,
    nativeMenu: true,
    updater: false,
    notifications: false,
    localAgent: false,
    pty: false,
    localMcp: false,
  })
  assert.equal(capabilities, getDesktopCapabilities())
  assert.equal(bridge.capabilities(), capabilities)
  assert.equal(Object.isFrozen(bridge), true)
  assert.equal(Object.isFrozen(bridge.commands), true)
  assert.equal(Object.isFrozen(capabilities), true)
  assert.equal('send' in bridge, false)
  assert.equal('invoke' in bridge, false)
  assert.equal('auth' in bridge, false)
  assert.equal('runs' in bridge, false)

  const received: DesktopCommandId[] = []
  const unsubscribe = bridge.commands.onInvoked((commandId) => {
    received.push(commandId)
  })
  commandSource.emit(DesktopCommandId.NAVIGATION_HOME)
  unsubscribe()
  commandSource.emit(DesktopCommandId.NAVIGATION_SEARCH)
  assert.deepEqual(received, [DesktopCommandId.NAVIGATION_HOME])
  assert.throws(
    () =>
      (
        bridge.commands.onInvoked as unknown as (
          listener: unknown,
        ) => () => void
      )(null),
    TypeError,
  )
})

test('renderer bridge factory does not create mutable capability copies', () => {
  const first = createDesktopBridge(createCommandSource())
  const second = createDesktopBridge(createCommandSource())

  assert.notEqual(first, second)
  assert.equal(first.capabilities(), second.capabilities())
  assert.throws(() => {
    ;(first.capabilities() as { desktop: boolean }).desktop = false
  }, TypeError)
})
