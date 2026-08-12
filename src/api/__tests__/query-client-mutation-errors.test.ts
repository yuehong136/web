import assert from 'node:assert/strict'
import { test } from 'node:test'
import { APIError } from '@/api/client-types'
import {
  createQueryClient,
  type MutationErrorNotifier,
} from '@/lib/query-client'
import {
  MutationErrorFeedback,
  type MutationErrorNotice,
} from '@/lib/mutation-error-feedback'

interface ExecuteFailureOptions {
  error: unknown
  feedback?: MutationErrorFeedback
  onError?: () => void
  variables?: unknown
}

async function executeFailure(
  notifyMutationError: MutationErrorNotifier,
  { error, feedback, onError, variables = undefined }: ExecuteFailureOptions,
): Promise<void> {
  const queryClient = createQueryClient({ notifyMutationError })
  const mutation = queryClient.getMutationCache().build(queryClient, {
    ...(feedback ? { meta: { errorFeedback: feedback } } : {}),
    mutationFn: async () => {
      throw error
    },
    onError,
  })

  await assert.rejects(mutation.execute(variables))
  queryClient.clear()
}

test('an unhandled server failure emits one safe notice with a stable id', async () => {
  const notices: MutationErrorNotice[] = []
  const secret = 'token-super-secret'

  await executeFailure((notice) => notices.push(notice), {
    error: new APIError(500, 'INTERNAL', `database leaked ${secret}`, {
      password: secret,
    }),
    variables: { password: secret, token: secret },
  })

  assert.deepEqual(notices, [
    {
      messageKey: 'common.errors.serverError',
      toastId: 'mutation-error:common.errors.serverError',
    },
  ])
  assert.equal(JSON.stringify(notices).includes(secret), false)
})

test('the same error class reuses its stable toast id', async () => {
  const notices: MutationErrorNotice[] = []
  const notify = (notice: MutationErrorNotice) => notices.push(notice)

  await executeFailure(notify, {
    error: new APIError(500, 'FIRST', 'first raw message'),
  })
  await executeFailure(notify, {
    error: new APIError(503, 'SECOND', 'second raw message'),
  })

  assert.equal(notices.length, 2)
  assert.equal(notices[0]?.toastId, notices[1]?.toastId)
})

test('local ownership, silent failures, 401, and hook onError skip global feedback', async () => {
  const notices: MutationErrorNotice[] = []
  const notify = (notice: MutationErrorNotice) => notices.push(notice)
  let localHandlerCalls = 0

  await executeFailure(notify, {
    error: new APIError(500, 'LOCAL', 'raw'),
    feedback: MutationErrorFeedback.Local,
  })
  await executeFailure(notify, {
    error: new APIError(500, 'SILENT', 'raw'),
    feedback: MutationErrorFeedback.Silent,
  })
  await executeFailure(notify, {
    error: new APIError(401, 'UNAUTHORIZED', 'raw'),
  })
  await executeFailure(notify, {
    error: new APIError(500, 'HOOK_OWNED', 'raw'),
    onError: () => {
      localHandlerCalls += 1
    },
  })

  assert.equal(localHandlerCalls, 1)
  assert.deepEqual(notices, [])
})

test('API errors map to fixed product message keys', async () => {
  const cases = [
    [new APIError(403, 'HTTP_ERROR', 'raw'), 'common.errors.forbidden'],
    [new APIError(0, 'NETWORK_ERROR', 'raw'), 'common.errors.network'],
    [new APIError(408, 'TIMEOUT', 'raw'), 'common.errors.timeout'],
    [new APIError(0, 'TIMEOUT', 'raw'), 'common.errors.timeout'],
    [new APIError(404, 'HTTP_ERROR', 'raw'), 'common.errors.notFound'],
    [new APIError(422, 'HTTP_ERROR', 'raw'), 'common.errors.validationError'],
    [new APIError(429, 'HTTP_ERROR', 'raw'), 'common.operationFailed'],
  ] as const

  for (const [error, expectedKey] of cases) {
    const notices: MutationErrorNotice[] = []
    await executeFailure((notice) => notices.push(notice), { error })
    assert.equal(notices[0]?.messageKey, expectedKey)
  }
})

test('aborted and unknown failures follow their safe fallback contracts', async () => {
  const notices: MutationErrorNotice[] = []
  const notify = (notice: MutationErrorNotice) => notices.push(notice)

  await executeFailure(notify, {
    error: new APIError(0, 'ABORTED', 'user cancelled'),
  })
  await executeFailure(notify, {
    error: new Error('raw runtime failure'),
  })

  assert.deepEqual(notices, [
    {
      messageKey: 'common.errors.unknown',
      toastId: 'mutation-error:common.errors.unknown',
    },
  ])
})

test('explicit global ownership can coexist with a rollback handler', async () => {
  const notices: MutationErrorNotice[] = []
  let rollbackCalls = 0

  await executeFailure((notice) => notices.push(notice), {
    error: new APIError(500, 'ROLLBACK', 'raw'),
    feedback: MutationErrorFeedback.Global,
    onError: () => {
      rollbackCalls += 1
    },
  })

  assert.equal(rollbackCalls, 1)
  assert.equal(notices.length, 1)
  assert.equal(notices[0]?.messageKey, 'common.errors.serverError')
})
