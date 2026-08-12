import { APIError } from '@/api/client-types'

export enum MutationErrorFeedback {
  Global = 'global',
  Local = 'local',
  Silent = 'silent',
}

export type MutationErrorMessageKey =
  | 'common.errors.network'
  | 'common.errors.timeout'
  | 'common.errors.forbidden'
  | 'common.errors.notFound'
  | 'common.errors.serverError'
  | 'common.errors.validationError'
  | 'common.errors.unknown'
  | 'common.operationFailed'

export interface MutationErrorNotice {
  messageKey: MutationErrorMessageKey
  toastId: string
}

const notice = (messageKey: MutationErrorMessageKey): MutationErrorNotice => ({
  messageKey,
  toastId: `mutation-error:${messageKey}`,
})

/**
 * Maps an untrusted mutation failure to a fixed product message.
 *
 * Deliberately do not inspect APIError.message/details or mutation variables:
 * those values may contain backend internals, prompts, passwords, or API keys.
 */
export function getMutationErrorNotice(
  error: unknown,
): MutationErrorNotice | null {
  if (!(error instanceof APIError)) {
    return notice('common.errors.unknown')
  }

  const code = error.code.toUpperCase()

  if (error.status === 401 || code === 'ABORTED') {
    return null
  }

  if (error.status === 408 || code === 'TIMEOUT') {
    return notice('common.errors.timeout')
  }

  if (error.status === 0 || code === 'NETWORK_ERROR') {
    return notice('common.errors.network')
  }

  if (error.status === 403) {
    return notice('common.errors.forbidden')
  }

  if (error.status === 404) {
    return notice('common.errors.notFound')
  }

  if (error.status === 429) {
    return notice('common.operationFailed')
  }

  if (error.status >= 400 && error.status <= 422) {
    return notice('common.errors.validationError')
  }

  if (error.status >= 500) {
    return notice('common.errors.serverError')
  }

  return notice('common.errors.unknown')
}
