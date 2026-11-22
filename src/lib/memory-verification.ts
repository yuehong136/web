import { APIError } from '@/api/client'
import type { MemoryVerificationRecord } from '@/types/memory-verification'
export const humanVerificationCurrent = (record: MemoryVerificationRecord) =>
  record.valid_for_current === true &&
  record.effective_status === 'human_confirmed' &&
  record.is_current === true &&
  record.state === 'active' &&
  !record.review_required
export function memoryVerificationError(error: unknown): string {
  if (error instanceof APIError && error.status === 409)
    return 'memory.verification.stale'
  if (error instanceof APIError && error.status === 422)
    return 'memory.verification.invalid'
  if (error instanceof APIError && [401, 403, 404].includes(error.status))
    return 'memory.verification.readFailed'
  return 'memory.verification.unknown'
}
