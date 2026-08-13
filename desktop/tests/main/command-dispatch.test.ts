import assert from 'node:assert/strict'
import test from 'node:test'
import type { BrowserWindow } from 'electron'
import { dispatchDesktopCommand } from '../../electron/main/commands/command-dispatch'
import {
  DESKTOP_COMMAND_INVOKED_CHANNEL,
  DesktopCommandId,
} from '../../protocol/renderer-bridge'

interface FakeWindowOptions {
  readonly windowDestroyed?: boolean
  readonly webContentsDestroyed?: boolean
  readonly url?: string
  readonly sendError?: Error
}

function createFakeWindow(options: FakeWindowOptions = {}): {
  readonly window: BrowserWindow
  readonly sent: unknown[][]
} {
  const sent: unknown[][] = []
  const window = {
    isDestroyed: () => options.windowDestroyed ?? false,
    webContents: {
      isDestroyed: () => options.webContentsDestroyed ?? false,
      getURL: () => options.url ?? 'app://bundle/',
      send: (...arguments_: unknown[]) => {
        if (options.sendError) throw options.sendError
        sent.push(arguments_)
      },
    },
  } as unknown as BrowserWindow
  return { window, sent }
}

test('main dispatch sends a fixed channel and allowlisted id to a trusted window', () => {
  const fixture = createFakeWindow({
    url: 'app://bundle/agent/run-1?tab=logs#tail',
  })

  assert.equal(
    dispatchDesktopCommand(fixture.window, DesktopCommandId.NAVIGATION_SEARCH),
    true,
  )
  assert.deepEqual(fixture.sent, [
    [DESKTOP_COMMAND_INVOKED_CHANNEL, DesktopCommandId.NAVIGATION_SEARCH],
  ])
})

test('main dispatch fails closed for invalid windows, urls, ids, and send races', () => {
  const cases: Array<{
    readonly window: BrowserWindow | null | undefined
    readonly commandId: unknown
  }> = [
    { window: null, commandId: DesktopCommandId.PALETTE_OPEN },
    { window: undefined, commandId: DesktopCommandId.PALETTE_OPEN },
    {
      window: createFakeWindow({ windowDestroyed: true }).window,
      commandId: DesktopCommandId.PALETTE_OPEN,
    },
    {
      window: createFakeWindow({ webContentsDestroyed: true }).window,
      commandId: DesktopCommandId.PALETTE_OPEN,
    },
    {
      window: createFakeWindow({ url: 'https://example.com/' }).window,
      commandId: DesktopCommandId.PALETTE_OPEN,
    },
    {
      window: createFakeWindow().window,
      commandId: 'desktop.open-devtools',
    },
    {
      window: createFakeWindow({ sendError: new Error('destroyed') }).window,
      commandId: DesktopCommandId.PALETTE_OPEN,
    },
  ]

  for (const fixture of cases) {
    assert.equal(
      dispatchDesktopCommand(fixture.window, fixture.commandId),
      false,
    )
  }
})
