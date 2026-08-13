import type { ApplicationComposition } from '@/platform'
import { mountApplication } from './mount-application'
import { ClientRuntime } from './runtime-selection'

export function mountDesktopApplication(
  composition: ApplicationComposition,
): void {
  mountApplication(composition, ClientRuntime.DESKTOP)
}
