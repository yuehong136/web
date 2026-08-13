import type { BrowserWindow } from 'electron'
import {
  DESKTOP_COMMAND_INVOKED_CHANNEL,
  isDesktopCommandId,
} from '../../../protocol/renderer-bridge'
import { isTrustedAppUrl } from '../app-protocol/app-url'

export function dispatchDesktopCommand(
  targetWindow: BrowserWindow | null | undefined,
  commandId: unknown,
): boolean {
  try {
    if (
      !targetWindow ||
      targetWindow.isDestroyed() ||
      targetWindow.webContents.isDestroyed() ||
      !isDesktopCommandId(commandId) ||
      !isTrustedAppUrl(targetWindow.webContents.getURL())
    ) {
      return false
    }

    targetWindow.webContents.send(DESKTOP_COMMAND_INVOKED_CHANNEL, commandId)
    return true
  } catch {
    return false
  }
}
