import { memoryRevisionKeys } from './memory-revision-keys'
export const memoryVerificationKeys = {
  bank: (id: string) =>
    [...memoryRevisionKeys.bank(id), 'verification'] as const,
  snapshot: (id: string, eid: string) =>
    [...memoryVerificationKeys.bank(id), 'snapshot', eid] as const,
  history: (id: string, eid: string, cursor?: string) =>
    [...memoryVerificationKeys.bank(id), 'history', eid, cursor] as const,
  todos: (id: string, cursor?: string) =>
    [...memoryVerificationKeys.bank(id), 'todos', cursor] as const,
  operation: (id: string, op: string) =>
    [...memoryVerificationKeys.bank(id), 'operation', op] as const,
}
