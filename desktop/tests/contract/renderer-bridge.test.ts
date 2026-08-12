import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createDesktopBridge,
  DESKTOP_BRIDGE_VERSION,
  getDesktopCapabilities,
} from '../../protocol/renderer-bridge'

test('renderer bridge exposes only the immutable capability snapshot', () => {
  const bridge = createDesktopBridge()
  const capabilities = bridge.capabilities()

  assert.equal(bridge.version, DESKTOP_BRIDGE_VERSION)
  assert.deepEqual(Object.keys(bridge).sort(), ['capabilities', 'version'])
  assert.deepEqual(capabilities, {
    desktop: true,
    updater: false,
    notifications: false,
    localAgent: false,
    pty: false,
    localMcp: false,
  })
  assert.equal(capabilities, getDesktopCapabilities())
  assert.equal(bridge.capabilities(), capabilities)
  assert.equal(Object.isFrozen(bridge), true)
  assert.equal(Object.isFrozen(capabilities), true)
  assert.equal('send' in bridge, false)
  assert.equal('invoke' in bridge, false)
  assert.equal('auth' in bridge, false)
  assert.equal('runs' in bridge, false)
})

test('renderer bridge factory does not create mutable capability copies', () => {
  const first = createDesktopBridge()
  const second = createDesktopBridge()

  assert.notEqual(first, second)
  assert.equal(first.capabilities(), second.capabilities())
  assert.throws(() => {
    ;(first.capabilities() as { desktop: boolean }).desktop = false
  }, TypeError)
})
