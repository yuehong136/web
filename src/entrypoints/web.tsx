import { createBrowserApplicationComposition } from '@/platform/browser'
import { mountApplication } from './mount-application'
import { ClientRuntime } from './runtime-selection'

export function mountWebApplication(): void {
  mountApplication(createBrowserApplicationComposition(), ClientRuntime.WEB)
}
