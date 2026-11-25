import type {
  GatewayCatalog,
  GatewayKey,
  GatewayKeyCreateInput,
} from '@/api/model-gateway'
import {
  emptyScope,
  scopeOfKey,
  scopePayload,
  type KeyScope,
} from '../../catalog'
import type { KeyFormRequest } from '../../constants'
import {
  emptyLimitDraft,
  expiryDraftOf,
  limitDraftOf,
  parseExpiryDraft,
  parseLimits,
  parseQuota,
  quotaDraftOf,
  toLocalInputValue,
  type ExpiryDraft,
  type LimitDraft,
  type QuotaDraft,
} from '../../form-model'
import { PREFIX } from '../../utils'

export interface KeyDraft {
  name: string
  description: string
  scope: KeyScope
  expiry: ExpiryDraft
  limits: LimitDraft
  quota: QuotaDraft
}

/**
 * The form's starting point: empty for a new key, the key itself when editing.
 */
export function initialDraft(request: KeyFormRequest): KeyDraft {
  if (request.mode === 'create')
    return {
      name: '',
      description: '',
      scope: emptyScope(),
      expiry: { preset: 'never', custom: '' },
      limits: emptyLimitDraft(),
      quota: quotaDraftOf(null, null),
    }
  const key = request.key
  return {
    name: key.name,
    description: key.description ?? '',
    scope: scopeOfKey(key),
    expiry: expiryDraftOf(key.expires_at),
    limits: limitDraftOf(key),
    quota: quotaDraftOf(key.token_quota, key.quota_period),
  }
}

/** An existing key's expiry the reader did not touch is not sent again. */
function expiryUnchanged(draft: ExpiryDraft, key: GatewayKey | null) {
  if (!key) return false
  if (draft.preset === 'never') return key.expires_at === null
  return (
    draft.preset === 'custom' &&
    key.expires_at !== null &&
    draft.custom === toLocalInputValue(key.expires_at)
  )
}

export type KeyInputResult =
  { ok: true; input: GatewayKeyCreateInput } | { ok: false; errorKey: string }

/** Validates the draft and builds the create or update body. */
export function buildKeyInput(
  draft: KeyDraft,
  request: KeyFormRequest,
  catalog: GatewayCatalog,
  now: number = Date.now(),
): KeyInputResult {
  const name = draft.name.trim()
  if (!name) return { ok: false, errorKey: `${PREFIX}.errors.nameRequired` }
  const limits = parseLimits(draft.limits)
  const quota = parseQuota(draft.quota)
  if (!limits || !quota)
    return { ok: false, errorKey: `${PREFIX}.errors.invalidLimit` }
  const editing = request.mode === 'edit' ? request.key : null
  const keepExpiry = expiryUnchanged(draft.expiry, editing)
  const expiresAt = keepExpiry ? undefined : parseExpiryDraft(draft.expiry, now)
  if (!keepExpiry && expiresAt === undefined)
    return { ok: false, errorKey: `${PREFIX}.errors.invalidExpiry` }
  return {
    ok: true,
    input: {
      name,
      description: draft.description.trim() || null,
      ...scopePayload(catalog, draft.scope),
      ...limits,
      ...quota,
      ...(keepExpiry ? {} : { expires_at: expiresAt ?? null }),
    },
  }
}
