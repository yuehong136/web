import { z } from 'zod'
import { APIError } from './client'

const envelope = z.object({
  code: z.number().int(),
  message: z.string(),
  data: z.unknown(),
})
const invalid = (status: number) =>
  new APIError(status, 'INVALID_SKILL_RESPONSE', 'Invalid skill response')

/** Domain contract reader, invoked by APIClient with shared auth/abort protection. */
export function skillResponse<T>(
  schema: z.ZodType<T>,
  expectedStatus: 200 | 202 = 200,
) {
  return async (response: Response): Promise<T> => {
    if (!response.headers.get('content-type')?.includes('application/json'))
      throw invalid(response.status)
    const parsed = envelope.safeParse(await response.json().catch(() => null))
    if (!parsed.success) throw invalid(response.status)
    const body = parsed.data
    if (!response.ok) {
      const error = z
        .object({ error_code: z.string().min(1) })
        .safeParse(body.data)
      if (body.code !== response.status || !error.success)
        throw invalid(response.status)
      throw new APIError(
        response.status,
        error.data.error_code,
        'Skill request failed',
      )
    }
    if (response.status !== expectedStatus || body.code !== 0)
      throw invalid(response.status)
    const data = schema.safeParse(body.data)
    if (!data.success) throw invalid(response.status)
    return data.data
  }
}

export async function skillBinaryResponse(response: Response): Promise<Blob> {
  if (!response.ok) return skillResponse(z.never())(response)
  if (response.status !== 200) throw invalid(response.status)
  return response.blob()
}
