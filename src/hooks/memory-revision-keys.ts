import { memoryKeys } from '@/hooks/use-memory'

export const memoryRevisionKeys = {
  bank: (id: string) => [...memoryKeys.all, id, 'managed'] as const,
  capabilities: (id: string) =>
    [...memoryRevisionKeys.bank(id), 'capabilities'] as const,
  entries: (id: string) => [...memoryRevisionKeys.bank(id), 'entry'] as const,
  entry: (id: string, messageId: string) =>
    [...memoryRevisionKeys.entries(id), messageId] as const,
  histories: (id: string) =>
    [...memoryRevisionKeys.bank(id), 'history'] as const,
  history: (id: string, entryId: string, cursor?: string) =>
    [...memoryRevisionKeys.histories(id), entryId, cursor] as const,
  sources: (id: string) => [...memoryRevisionKeys.bank(id), 'source'] as const,
  source: (id: string, sourceId: string) =>
    [...memoryRevisionKeys.sources(id), sourceId] as const,
  operation: (id: string, operationId: string) =>
    [...memoryRevisionKeys.bank(id), 'operation', operationId] as const,
  operations: (id: string) =>
    [...memoryRevisionKeys.bank(id), 'operations'] as const,
  inbox: (id: string, view: string, cursor?: string) =>
    [...memoryRevisionKeys.operations(id), view, cursor] as const,
}
