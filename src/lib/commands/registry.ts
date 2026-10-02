import type { CommandContext, ProductCommand } from './types'
import { ProductCommandId } from './types'

export class CommandRegistry {
  private readonly commands = new Map<ProductCommandId, ProductCommand>()

  private revision = 0
  private readonly listeners = new Set<() => void>()
  readonly getRevision = () => this.revision
  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  private notify() {
    this.revision += 1
    this.listeners.forEach((listener) => listener())
  }

  register(command: ProductCommand): () => void {
    if (this.commands.has(command.id)) {
      throw new Error(`Duplicate product command: ${command.id}`)
    }

    this.commands.set(command.id, command)
    this.notify()
    let disposed = false

    return () => {
      if (disposed) return
      disposed = true
      if (this.commands.get(command.id) === command) {
        this.commands.delete(command.id)
        this.notify()
      }
    }
  }

  list(): ProductCommand[] {
    return Array.from(this.commands.values()).filter(
      (command) => command.isVisible?.() !== false,
    )
  }

  get(id: ProductCommandId): ProductCommand | undefined {
    return this.commands.get(id)
  }

  async execute(
    id: ProductCommandId,
    context: CommandContext,
  ): Promise<boolean> {
    const command = this.commands.get(id)
    if (!command || command.isVisible?.() === false) return false
    if (command.isEnabled?.() === false) return false

    await command.run(context)
    return true
  }
}
