import { create } from 'zustand'

/** The range the MCP chat endpoint accepts for one tool call, in milliseconds. */
export const MCP_TIMEOUT_MIN = 100
export const MCP_TIMEOUT_MAX = 30_000

interface HomeChatOptions {
  /** Longest wait for one MCP tool call, in milliseconds. */
  mcpTimeout: number
  /** Ask the service to report every tool call in detail. */
  verboseToolUse: boolean
  /** The conversation spans the whole pane instead of the reading column. */
  fullWidth: boolean
  setMcpTimeout: (milliseconds: number) => void
  setVerboseToolUse: (enabled: boolean) => void
  setFullWidth: (enabled: boolean) => void
}

export const clampMcpTimeout = (milliseconds: number) =>
  Number.isFinite(milliseconds)
    ? Math.min(
        MCP_TIMEOUT_MAX,
        Math.max(MCP_TIMEOUT_MIN, Math.round(milliseconds)),
      )
    : MCP_TIMEOUT_MAX

/**
 * Home's chat preferences for this session (not persisted): how MCP tools are
 * called and how wide the conversation is.
 */
export const useHomeChatOptions = create<HomeChatOptions>((set) => ({
  mcpTimeout: MCP_TIMEOUT_MAX,
  verboseToolUse: true,
  fullWidth: false,
  setMcpTimeout: (milliseconds) =>
    set({ mcpTimeout: clampMcpTimeout(milliseconds) }),
  setVerboseToolUse: (verboseToolUse) => set({ verboseToolUse }),
  setFullWidth: (fullWidth) => set({ fullWidth }),
}))
