export {
  createDesktopBridge,
  DESKTOP_BRIDGE_VERSION,
  getDesktopCapabilities,
} from './capabilities'
export type { DesktopCapabilities, MultiRagDesktopBridge } from './capabilities'
export {
  DESKTOP_COMMAND_INVOKED_CHANNEL,
  DesktopCommandId,
  isDesktopCommandId,
} from './commands'
export type {
  DesktopCommandBridge,
  DesktopCommandListener,
  DesktopCommandSource,
} from './commands'
