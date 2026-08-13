import { contextBridge, ipcRenderer } from 'electron'
import { createDesktopBridge } from '../../protocol/renderer-bridge'
import { createDesktopCommandSource } from './command-source'

contextBridge.exposeInMainWorld(
  'multiRagDesktop',
  createDesktopBridge(createDesktopCommandSource(ipcRenderer)),
)
