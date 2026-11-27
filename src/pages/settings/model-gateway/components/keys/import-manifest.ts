import { z } from 'zod'
import type { GatewayImportBatch } from '@/api/model-gateway'

const digest = z.string().regex(/^[0-9a-f]{64}$/)
const text = z.string().min(1)
const limit = z.number().int().positive().nullable().optional()
// Only explicitly supported fields may leave the browser.
const rowSchema = z
  .strictObject({
    source_id: text,
    tenant_id: text.optional(),
    name: text,
    description: z.string().nullable().optional(),
    tags: z.record(text, z.string()).nullable().optional(),
    sha256: digest.optional(),
    key: z
      .string()
      .regex(/^(?!sk-mrag-|multirag-|ragflow-)[A-Za-z0-9._~+/-]{32,256}={0,2}$/)
      .optional(),
    alternate_sha256: z.array(digest).max(8).optional(),
    allow_raw_authorization: z.boolean().optional(),
    status: z.enum(['active', 'disabled', 'revoked']),
    expires_at: z.string().nullable(),
    unresolved: z.array(text),
    allow_all_models: z.boolean().optional(),
    allowed_model_ids: z.array(text).optional(),
    allowed_instance_ids: z.array(text).optional(),
    rpm_limit: limit,
    tpm_limit: limit,
    max_parallel_requests: limit,
    token_quota: limit,
    quota_period: z.enum(['day', 'month']).nullable().optional(),
  })
  .refine((row) => Boolean(row.sha256) !== Boolean(row.key))

const schema = z.strictObject({
  source: text,
  keys: z.array(rowSchema).min(1).max(1000),
})

export class ManifestError extends Error {
  constructor(
    readonly reason: 'fileSize' | 'invalid' | 'secure' | 'tenant',
    readonly row?: number,
  ) {
    super(reason)
  }
}

export async function readImportManifest(
  file: File,
  tenantId: string,
): Promise<GatewayImportBatch> {
  if (file.size > 2 * 1024 * 1024) throw new ManifestError('fileSize')
  let content: unknown
  try {
    content = JSON.parse(await file.text())
  } catch {
    throw new ManifestError('invalid')
  }
  const parsed = schema.safeParse(content)
  if (!parsed.success) {
    const index = parsed.error.issues[0]?.path[1]
    throw new ManifestError(
      'invalid',
      typeof index === 'number' ? index + 1 : undefined,
    )
  }
  const keys = await Promise.all(
    parsed.data.keys.map(async ({ key, sha256, ...row }, i) => {
      if (row.tenant_id && row.tenant_id !== tenantId)
        throw new ManifestError('tenant', i + 1)
      if (key) {
        if (!globalThis.crypto?.subtle) throw new ManifestError('secure')
        const bytes = await crypto.subtle.digest(
          'SHA-256',
          new TextEncoder().encode(key),
        )
        sha256 = Array.from(new Uint8Array(bytes), (byte) =>
          byte.toString(16).padStart(2, '0'),
        ).join('')
      }
      if (!sha256) throw new ManifestError('invalid', i + 1)
      return { ...row, tenant_id: tenantId, sha256 }
    }),
  )
  return { source: parsed.data.source, keys }
}

export function exampleManifest(tenantId: string): string {
  return JSON.stringify(
    {
      source: 'previous-gateway',
      keys: [
        {
          tenant_id: tenantId,
          source_id: '42',
          name: 'support-bot',
          description: '',
          key: '<complete existing token>',
          status: 'disabled',
          expires_at: null,
          allow_all_models: false,
          allowed_model_ids: [],
          unresolved: [],
        },
      ],
    },
    null,
    2,
  )
}
