import { API_BASE_URL } from '@/constants'
import { apiClient } from './client'
import type {
  MemoryVerificationSnapshot,
  MemoryVerificationCommand,
  MemoryVerificationRevocation,
  MemoryVerificationOperation,
  MemoryVerificationHistory,
  MemoryVerificationTodos,
} from '@/types/memory-verification'
/** Version-bound human assessments have their own SQL operation receipt, separate from publication. */
export function createMemoryVerificationAPI(
  baseURL = API_BASE_URL,
  client = apiClient,
) {
  const sdkBase = { baseURL: `${baseURL}/api` }
  const bank = (id: string) => `/memories/${encodeURIComponent(id)}`
  const entry = (id: string, eid: string) =>
    `${bank(id)}/entries/${encodeURIComponent(eid)}`
  return {
    snapshot: (
      id: string,
      eid: string,
      signal?: AbortSignal,
    ): Promise<MemoryVerificationSnapshot> =>
      client.get(`${entry(id, eid)}/verification-snapshot`, {
        ...sdkBase,
        signal,
      }),
    record: (
      id: string,
      eid: string,
      body: MemoryVerificationCommand,
    ): Promise<MemoryVerificationOperation> =>
      client.post(`${entry(id, eid)}/verifications`, body, sdkBase),
    revoke: (
      id: string,
      vid: string,
      body: MemoryVerificationRevocation,
    ): Promise<MemoryVerificationOperation> =>
      client.post(
        `${bank(id)}/verifications/${encodeURIComponent(vid)}/revocations`,
        body,
        sdkBase,
      ),
    history: (
      id: string,
      eid: string,
      cursor?: string,
      signal?: AbortSignal,
    ): Promise<MemoryVerificationHistory> =>
      client.get(`${entry(id, eid)}/verifications`, {
        ...sdkBase,
        signal,
        params: { limit: 20, ...(cursor ? { cursor } : {}) },
      }),
    operation: (
      id: string,
      op: string,
      signal?: AbortSignal,
    ): Promise<MemoryVerificationOperation> =>
      client.get(
        `${bank(id)}/verification-operations/${encodeURIComponent(op)}`,
        { ...sdkBase, signal },
      ),
    todos: (
      id: string,
      cursor?: string,
      signal?: AbortSignal,
    ): Promise<MemoryVerificationTodos> =>
      client.get(`${bank(id)}/verification-todos`, {
        ...sdkBase,
        signal,
        params: { limit: 10, ...(cursor ? { cursor } : {}) },
      }),
  }
}
