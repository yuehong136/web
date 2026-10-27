export const AgentGlobals = {
  SysQuery: 'sys.query',
  SysUserId: 'sys.user_id',
  SysConversationTurns: 'sys.conversation_turns',
  SysFiles: 'sys.files',
  SysFileRefs: 'sys.file_refs',
  SysHistory: 'sys.history',
  SysDate: 'sys.date',
} as const

export type AgentGlobals = (typeof AgentGlobals)[keyof typeof AgentGlobals]
