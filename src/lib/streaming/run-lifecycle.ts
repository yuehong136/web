/** Subscription outcomes and confirmed server outcomes remain distinct. */
export type RunPhase =
  | 'running'
  | 'completed'
  | 'failed'
  | 'interrupted'
  | 'locallyStopped'
  | 'cancelRequested'
  | 'serverCancelled'

export const isRunTerminal = (phase: RunPhase): boolean =>
  phase !== 'running' && phase !== 'cancelRequested'

/** The first terminal observation wins, including duplicate/late frames. */
export const transitionRunPhase = (
  phase: RunPhase,
  next: Exclude<RunPhase, 'running'>,
): RunPhase => (isRunTerminal(phase) ? phase : next)

/** The server event names mirror the Run lifecycle contract. */
export const getServerRunPhase = (eventType: string): RunPhase | null => {
  switch (eventType) {
    case 'run.cancel_requested':
      return 'cancelRequested'
    case 'run.cancelled':
      return 'serverCancelled'
    case 'run.completed':
      return 'completed'
    case 'run.failed':
      return 'failed'
    case 'run.interrupted':
      return 'interrupted'
    default:
      return null
  }
}

export const getRunPhaseNotice = (phase: RunPhase) => {
  switch (phase) {
    case 'failed':
      return 'chat.stream.failed' as const
    case 'interrupted':
      return 'chat.stream.interrupted' as const
    case 'locallyStopped':
      return 'chat.stream.locallyStopped' as const
    case 'cancelRequested':
      return 'chat.stream.cancelRequested' as const
    case 'serverCancelled':
      return 'chat.stream.serverCancelled' as const
    default:
      return null
  }
}
