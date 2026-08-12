import { contextBridge } from 'electron'
import { createDesktopBridge } from '../../protocol/renderer-bridge'

contextBridge.exposeInMainWorld('multiRagDesktop', createDesktopBridge())
