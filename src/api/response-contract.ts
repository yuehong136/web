import { APIError } from './client-types'

/** Opt-in provenance check before shared legacy envelope normalization. */
export function assertRest200Contract(
  contract: 'rest200' | undefined,
  status: number,
  raw: unknown,
): void {
  if (contract !== 'rest200') return
  // The existing shared transport remains the owner of HTTP-401 handling.
  if (status === 401) return
  if (
    status !== 200 ||
    typeof raw !== 'object' ||
    raw === null ||
    Array.isArray(raw) ||
    !Object.hasOwn(raw, 'code') ||
    typeof (raw as Record<string, unknown>).code !== 'number' ||
    !Number.isInteger((raw as Record<string, unknown>).code) ||
    Object.hasOwn(raw, 'retcode')
  ) {
    throw new APIError(
      status,
      'INVALID_REST_RESPONSE',
      'Unexpected REST response',
    )
  }
}
