import { API_BASE_URL } from '@/constants'
import { apiClient } from './client'
import type {
  MemoryStartupRequest,
  MemoryStartupPackage,
  MemoryBoundSourceReference,
  MemoryBoundSourceExcerpt,
} from '@/types/memory-startup'
export function createMemoryStartupAPI(
  baseURL = API_BASE_URL,
  client = apiClient,
) {
  const config = { baseURL: `${baseURL}/api`, cache: 'no-store' as const }
  return {
    preview: (
      id: string,
      request: MemoryStartupRequest,
      signal?: AbortSignal,
    ): Promise<MemoryStartupPackage> =>
      client.post(
        `/memories/${encodeURIComponent(id)}/startup-context`,
        request,
        { ...config, signal },
      ),
    source: (
      id: string,
      source: MemoryBoundSourceReference,
      offset: number,
      limit = 512,
      signal?: AbortSignal,
    ): Promise<MemoryBoundSourceExcerpt> => {
      // The shared client's optional params omit empty strings; bound scope must retain them.
      const query = new URLSearchParams({
        expected_source_revision: source.source_revision,
        expected_source_generation: source.source_generation,
        content_sha256: source.content_sha256,
        user_id: source.scope.user_id,
        agent_id: source.scope.agent_id,
        session_id: source.scope.session_id,
        offset: String(offset),
        limit: String(limit),
      })
      return client.get(
        `/memories/${encodeURIComponent(id)}/sources/${encodeURIComponent(source.source_id)}?${query}`,
        { ...config, signal },
      )
    },
  }
}
