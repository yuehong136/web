import {
  APIError,
  apiClient,
  type ApiEnvelope,
  type RequestConfig,
} from './client'

enum CancellationErrorCode {
  InvalidAcknowledgement = 'INVALID_CANCEL_ACK',
}

/** An acknowledgement means submitted/no-op, never proof that a worker stopped. */
export async function requestTaskCancellation(
  taskId: string,
  config: RequestConfig,
): Promise<boolean> {
  const acknowledgement = await apiClient.post<ApiEnvelope<unknown>>(
    `/tasks/${encodeURIComponent(taskId)}/cancel`,
    undefined,
    { ...config, withEnvelope: true },
  )
  if (acknowledgement?.retcode !== 0 || acknowledgement.data !== true) {
    throw new APIError(
      200,
      CancellationErrorCode.InvalidAcknowledgement,
      'Invalid cancellation acknowledgement',
    )
  }
  return true
}
