import { API_BASE_URL } from '@/constants'
import { apiClient } from './client'
import type {
  MemoryCompactionList,
  MemoryCompactionCommand,
  MemoryCompactionResult,
} from '@/types/memory-compaction'
import type {
  MemoryCompactionInventory,
  MemoryCompactionRetentionPreview,
} from '@/types/memory-compaction-retention'

export function createMemoryCompactionAPI(
  baseURL = API_BASE_URL,
  client = apiClient,
) {
  const config = { baseURL: `${baseURL}/api`, cache: 'no-store' as const }
  const bank = (id: string) => `/memories/${encodeURIComponent(id)}`
  const operation = (id: string, operationId: string) =>
    `${bank(id)}/context-compaction-operations/${encodeURIComponent(operationId)}`
  return {
    inventory: (
      id: string,
      signal?: AbortSignal,
    ): Promise<MemoryCompactionInventory> =>
      client.get(`${bank(id)}/context-compactions/inventory`, {
        ...config,
        signal,
      }),
    retentionPreview: (
      id: string,
      artifactId: string,
      signal?: AbortSignal,
    ): Promise<MemoryCompactionRetentionPreview> =>
      client.get(
        `${bank(id)}/context-compactions/${encodeURIComponent(artifactId)}/retention-preview`,
        { ...config, signal },
      ),
    retire: (
      id: string,
      artifactId: string,
      expectedPreviewSha256: string,
    ): Promise<MemoryCompactionResult> =>
      client.post(
        `${bank(id)}/context-compactions/${encodeURIComponent(artifactId)}/retirements`,
        { expected_preview_sha256: expectedPreviewSha256 },
        config,
      ),
    create: (
      id: string,
      command: MemoryCompactionCommand,
      signal?: AbortSignal,
    ): Promise<MemoryCompactionResult> =>
      client.post(`${bank(id)}/context-compactions`, command, {
        ...config,
        signal,
      }),
    operation: (
      id: string,
      operationId: string,
      signal?: AbortSignal,
    ): Promise<MemoryCompactionResult> =>
      client.get(operation(id, operationId), { ...config, signal }),
    artifact: (
      id: string,
      artifactId: string,
      signal?: AbortSignal,
    ): Promise<MemoryCompactionResult> =>
      client.get(
        `${bank(id)}/context-compactions/${encodeURIComponent(artifactId)}`,
        { ...config, signal },
      ),
    list: (
      id: string,
      cursor?: string,
      signal?: AbortSignal,
    ): Promise<MemoryCompactionList> =>
      client.get(`${bank(id)}/context-compactions`, {
        ...config,
        params: { limit: 20, cursor },
        signal,
      }),
    cancel: (
      id: string,
      operationId: string,
    ): Promise<MemoryCompactionResult> =>
      client.post(`${operation(id, operationId)}/cancellations`, {}, config),
  }
}
