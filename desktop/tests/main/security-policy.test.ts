import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldBlockMainFrameNavigation } from '../../electron/main/security/navigation-policy'
import {
  isTrustedSenderFrame,
  type SenderFrame,
} from '../../electron/main/security/sender-policy'
import { installSessionSecurityPolicy } from '../../electron/main/security/session-policy'
import { installWebContentsSecurityPolicy } from '../../electron/main/security/web-contents-policy'
import { createMainWindowWebPreferences } from '../../electron/main/windows/window-options'
import type { Session, WebContents } from 'electron'

test('top-level navigation stays inside the packaged renderer', () => {
  assert.equal(
    shouldBlockMainFrameNavigation('app://bundle/agent/run-1?tab=logs#tail'),
    false,
  )

  for (const value of [
    'https://example.com',
    'http://localhost:5173',
    'file:///tmp/index.html',
    'data:text/html,unsafe',
    'blob:app://bundle/id',
    'app://other/route',
    'app://user@bundle/route',
    'app://bundle:123/route',
    'app://bundle/%252e%252e/route',
  ]) {
    assert.equal(shouldBlockMainFrameNavigation(value), true, value)
  }

  assert.equal(
    shouldBlockMainFrameNavigation('https://iframe.example', false),
    false,
  )
})

test('sender validation requires the exact live top frame and trusted URL', () => {
  const topFrame: SenderFrame = {
    url: 'app://bundle/agent/run-1',
    parent: null,
    isDestroyed: () => false,
  }
  const childFrame: SenderFrame = {
    url: 'app://bundle/agent/run-1',
    parent: topFrame,
    isDestroyed: () => false,
  }

  assert.equal(isTrustedSenderFrame(topFrame, topFrame), true)
  assert.equal(isTrustedSenderFrame(childFrame, topFrame), false)
  assert.equal(
    isTrustedSenderFrame({ ...topFrame, url: 'https://example.com' }, topFrame),
    false,
  )
  assert.equal(
    isTrustedSenderFrame({ ...topFrame, isDestroyed: () => true }, topFrame),
    false,
  )
  assert.equal(isTrustedSenderFrame(null, topFrame), false)
})

test('session policy denies permission requests, devices, and downloads', () => {
  let permissionCheck: (() => boolean) | undefined
  let permissionRequest:
    | ((
        _contents: unknown,
        _permission: unknown,
        callback: (granted: boolean) => void,
      ) => void)
    | undefined
  let devicePermission: (() => boolean) | undefined
  let willDownload: ((event: { preventDefault(): void }) => void) | undefined

  const fakeSession = {
    setPermissionCheckHandler: (handler: () => boolean) => {
      permissionCheck = handler
    },
    setPermissionRequestHandler: (
      handler: (
        contents: unknown,
        permission: unknown,
        callback: (granted: boolean) => void,
      ) => void,
    ) => {
      permissionRequest = handler
    },
    setDevicePermissionHandler: (handler: () => boolean) => {
      devicePermission = handler
    },
    on: (
      eventName: string,
      handler: (event: { preventDefault(): void }) => void,
    ) => {
      assert.equal(eventName, 'will-download')
      willDownload = handler
    },
  }

  installSessionSecurityPolicy(fakeSession as unknown as Session)

  assert.equal(permissionCheck?.(), false)
  assert.equal(devicePermission?.(), false)
  let permissionGranted = true
  permissionRequest?.(null, 'notifications', (granted) => {
    permissionGranted = granted
  })
  assert.equal(permissionGranted, false)
  let downloadPrevented = false
  willDownload?.({ preventDefault: () => void (downloadPrevented = true) })
  assert.equal(downloadPrevented, true)
})

test('web contents policy denies popups, external navigation, and webviews', () => {
  let popupHandler: (() => { action: string }) | undefined
  const listeners = new Map<string, (...arguments_: unknown[]) => void>()
  const fakeWebContents = {
    setWindowOpenHandler: (handler: () => { action: string }) => {
      popupHandler = handler
    },
    on: (eventName: string, handler: (...arguments_: unknown[]) => void) => {
      listeners.set(eventName, handler)
    },
  }

  installWebContentsSecurityPolicy(fakeWebContents as unknown as WebContents)

  assert.deepEqual(popupHandler?.(), { action: 'deny' })

  let externalNavigationPrevented = false
  listeners.get('will-navigate')?.({
    url: 'https://example.com',
    isMainFrame: true,
    preventDefault: () => void (externalNavigationPrevented = true),
  })
  assert.equal(externalNavigationPrevented, true)

  let trustedNavigationPrevented = false
  listeners.get('will-frame-navigate')?.({
    url: 'app://bundle/agent/run-1',
    isMainFrame: true,
    preventDefault: () => void (trustedNavigationPrevented = true),
  })
  assert.equal(trustedNavigationPrevented, false)

  let webviewPrevented = false
  listeners.get('will-attach-webview')?.({
    preventDefault: () => void (webviewPrevented = true),
  })
  assert.equal(webviewPrevented, true)
})

test('main window preferences preserve the Renderer browser boundary', () => {
  const packaged = createMainWindowWebPreferences(
    '/app/preload/index.cjs',
    true,
  )

  assert.deepEqual(packaged, {
    preload: '/app/preload/index.cjs',
    sandbox: true,
    contextIsolation: true,
    nodeIntegration: false,
    nodeIntegrationInWorker: false,
    nodeIntegrationInSubFrames: false,
    webviewTag: false,
    webSecurity: true,
    allowRunningInsecureContent: false,
    experimentalFeatures: false,
    navigateOnDragDrop: false,
    safeDialogs: true,
    devTools: false,
  })
  assert.equal(Object.isFrozen(packaged), true)
  assert.equal(
    createMainWindowWebPreferences('/app/preload/index.cjs', false).devTools,
    true,
  )
})
