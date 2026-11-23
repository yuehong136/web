import { memoryKeys } from './use-memory'

export const memoryCompactionKeys = {
  bank: (id: string) => [...memoryKeys.all, id, 'compaction'] as const,
  operation: (id: string, operationId: string, readScope: string) =>
    [
      ...memoryCompactionKeys.bank(id),
      'operation',
      operationId,
      readScope,
    ] as const,
  list: (id: string, readScope: string, cursor?: string) =>
    [...memoryCompactionKeys.bank(id), 'list', readScope, cursor] as const,
  inventory: (id: string, readScope: string) =>
    [...memoryCompactionKeys.bank(id), 'inventory', readScope] as const,
  retentionPreview: (id: string, artifactId: string, readScope: string) =>
    [
      ...memoryCompactionKeys.bank(id),
      'retention-preview',
      artifactId,
      readScope,
    ] as const,
}
