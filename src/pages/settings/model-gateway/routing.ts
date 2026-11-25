import type {
  GatewayCatalogModel,
  GatewayCatalogModelUpdate,
  GatewayLog,
} from '@/api/model-gateway'
import { parsePositiveInteger } from './form-model'

/** Limits of LiteLLM's `order` and `weight` as the gateway accepts them. */
export const MAX_ORDER = 100
export const MAX_WEIGHT = 1000
const DEFAULT_WEIGHT = 1

/** How a model shares a name with others, as typed. */
export interface RoutingDraft {
  order: string
  weight: string
}

export const routingDraftOf = (model: GatewayCatalogModel): RoutingDraft => ({
  order:
    model.order === null || model.order === undefined
      ? ''
      : String(model.order),
  weight: String(model.weight ?? DEFAULT_WEIGHT),
})

type RoutingUpdate = Pick<GatewayCatalogModelUpdate, 'order' | 'weight'>

/**
 * The routing fields that differ from the model: an empty order clears it,
 * an empty weight returns to the default. `null` when a field is invalid.
 */
export function parseRoutingDraft(
  draft: RoutingDraft,
  model: GatewayCatalogModel,
): RoutingUpdate | null {
  const order = parsePositiveInteger(draft.order, MAX_ORDER)
  const weight = parsePositiveInteger(draft.weight, MAX_WEIGHT)
  if (order === undefined || weight === undefined) return null
  const update: RoutingUpdate = {}
  if (order !== (model.order ?? null)) update.order = order
  if ((weight ?? DEFAULT_WEIGHT) !== (model.weight ?? DEFAULT_WEIGHT))
    update.weight = weight
  return update
}

/** The widest pool of a model: the name it serves with the most others. */
export function widestPool(model: GatewayCatalogModel) {
  return (model.pools ?? []).reduce<
    NonNullable<GatewayCatalogModel['pools']>[number] | null
  >(
    (widest, pool) =>
      widest === null || pool.deployments > widest.deployments ? pool : widest,
    null,
  )
}

/** Upstream calls a request made beyond its first; 0 for a single call. */
export const retriesOf = (log: Pick<GatewayLog, 'attempts'>): number =>
  Math.max((log.attempts?.length ?? 0) - 1, 0)
