import { API_BASE_URL } from '@/constants'
import { apiClient } from './client'
import type { MemoryAppendOperation } from '@/types/memory-revisions'
import type {
  MemoryStructuredSourceCommand,
  MemorySourceProvenance,
  MemorySourceBinding,
} from '@/types/memory-sources'
export function createMemorySourcesAPI(
  baseURL = API_BASE_URL,
  client = apiClient,
) {
  const config = { baseURL: `${baseURL}/api`, cache: 'no-store' as const }
  return {
    create: (
      memoryId: string,
      command: MemoryStructuredSourceCommand,
    ): Promise<MemoryAppendOperation> =>
      client.post(
        `/memories/${encodeURIComponent(memoryId)}/sources`,
        command,
        config,
      ),
    provenance: (
      memoryId: string,
      sourceId: string,
      options: {
        binding?: MemorySourceBinding
        includeSegments?: boolean
        signal?: AbortSignal
      } = {},
    ): Promise<MemorySourceProvenance> => {
      const query = new URLSearchParams({
        include_segments: String(options.includeSegments ?? false),
      })
      const binding = options.binding
      if (binding) {
        query.set('expected_source_revision', binding.source_revision)
        query.set('expected_source_generation', binding.source_generation)
        query.set('content_sha256', binding.content_sha256)
        for (const field of ['user_id', 'agent_id', 'session_id'] as const)
          query.set(field, binding.scope[field])
        if (binding.provenance_sha256)
          query.set('expected_provenance_sha256', binding.provenance_sha256)
      }
      return client.get(
        `/memories/${encodeURIComponent(memoryId)}/sources/${encodeURIComponent(sourceId)}/provenance?${query}`,
        { ...config, signal: options.signal },
      )
    },
  }
}
