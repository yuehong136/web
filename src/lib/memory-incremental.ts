import { APIError } from '@/api/client'

export function incrementalErrorKey(error: unknown): string {
  if (error instanceof APIError && error.status === 409)
    return 'memory.incremental.conflict'
  if (error instanceof APIError && error.status === 422)
    return 'memory.incremental.invalidSelection'
  return 'memory.incremental.unknown'
}
