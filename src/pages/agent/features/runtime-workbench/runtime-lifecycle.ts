export interface AbortableRuntimeTransport {
  abort: () => void
}

export type CancelRuntimeRun = (taskId?: string) => Promise<void>

/**
 * Detach the current UI from its local transport without changing server state.
 */
export function detachRuntimeTransport(
  transport: AbortableRuntimeTransport | null,
): void {
  transport?.abort()
}

/**
 * An explicit user stop aborts the local transport before requesting server
 * cancellation. Passive lifecycle cleanup must use detachRuntimeTransport.
 */
export async function stopRuntimeRun(
  transport: AbortableRuntimeTransport | null,
  taskId: string | undefined,
  cancelRun: CancelRuntimeRun,
): Promise<void> {
  detachRuntimeTransport(transport)
  await cancelRun(taskId)
}
