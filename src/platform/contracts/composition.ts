import type { PlatformPort } from './platform'
import type { ProductCommandId } from '@/lib/commands/types'

export type CommandListener = (id: ProductCommandId) => void

export interface CommandSource {
  subscribe(listener: CommandListener): () => void
}

export interface ApplicationComposition {
  readonly platform: PlatformPort
  readonly commandSource: CommandSource
}
