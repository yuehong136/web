import type { IpcRenderer, IpcRendererEvent } from 'electron'
import {
  DESKTOP_COMMAND_INVOKED_CHANNEL,
  isDesktopCommandId,
  type DesktopCommandListener,
  type DesktopCommandSource,
} from '../../protocol/renderer-bridge'

type DesktopIpcRenderer = Pick<IpcRenderer, 'on' | 'removeListener'>

export function createDesktopCommandSource(
  ipcRenderer: DesktopIpcRenderer,
): DesktopCommandSource {
  return Object.freeze({
    subscribe(listener: DesktopCommandListener): () => void {
      if (typeof listener !== 'function') {
        throw new TypeError('Desktop command listener must be a function.')
      }

      const onCommand = (
        _event: IpcRendererEvent,
        commandId: unknown,
      ): void => {
        if (isDesktopCommandId(commandId)) listener(commandId)
      }

      ipcRenderer.on(DESKTOP_COMMAND_INVOKED_CHANNEL, onCommand)
      let subscribed = true

      return (): void => {
        if (!subscribed) return
        subscribed = false
        ipcRenderer.removeListener(DESKTOP_COMMAND_INVOKED_CHANNEL, onCommand)
      }
    },
  })
}
