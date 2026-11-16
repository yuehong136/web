/** Routed sections of a knowledge base, in navigation order. */
export const KNOWLEDGE_SECTIONS = [
  'documents',
  'graph',
  'search',
  'logs',
  'settings',
] as const

export type KnowledgeSection = (typeof KNOWLEDGE_SECTIONS)[number]
