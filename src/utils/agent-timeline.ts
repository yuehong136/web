/**
 * Back-compat shim: the agent timeline reducer moved to the shared streaming
 * runtime in ARCH-1 phase 2. Import from `@/lib/streaming` in new code; this
 * re-export keeps existing call surfaces unchanged until each one migrates
 * (see docs/streaming-runtime-design.md).
 */
export {
  consumeAgentTimelineEvent,
  createInitialAgentTimelineState,
  type AgentStreamEvent,
  type AgentTimelineKind,
  type AgentTimelineNode,
  type AgentTimelineState,
  type AgentTimelineStatus,
} from '@/lib/streaming/agent-timeline'
