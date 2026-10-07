import {
  extractReferencesFromSSEData,
  type ReferenceChunk,
} from '@/utils/reference-replacer'

/**
 * Home 应用模式流式帧里的引用合并（MultiRAG 旧版 `/v1/conversation/completion`）。
 *
 * 帧协议：增量帧 `final: false` 的 `reference` 经 structure_answer 后是
 * `{chunks: []}`，空数组表示这一帧没带引用；终帧 `final: true` 携带本轮的权威引用，
 * 服务端按它持久化，明确为空（包括无知识库时下发的 `reference: {}`）就是本轮没有引用。
 * 错误帧的 `reference: []` 不是引用快照。
 */

export interface ConversationHistoryMessage {
  id?: string
  role?: string
  content?: string
  reference?: {
    chunks?: ReferenceChunk[]
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * 一帧携带的引用快照；帧里没有引用字段时为 null。数组、keyed map 与旧版
 * `data.chunks` 都走共享提取，keyed map 保留 reference_index / reference_key。
 */
export const readFrameReferences = (
  payload: unknown,
): ReferenceChunk[] | null => {
  if (!isRecord(payload)) return null
  const carriesReferences =
    isRecord(payload.reference) ||
    Array.isArray(payload.chunks) ||
    isRecord(payload.chunks)
  return carriesReferences ? extractReferencesFromSSEData(payload) : null
}

// 引用来自 JSON：只比较普通对象、数组与原始值，值为 undefined 的键视同缺失
const isSameValue = (left: unknown, right: unknown): boolean => {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((item, index) => isSameValue(item, right[index]))
    )
  }
  if (!isRecord(left) || !isRecord(right)) return false
  const keys = (record: Record<string, unknown>) =>
    Object.keys(record).filter((key) => record[key] !== undefined)
  const leftKeys = keys(left)
  return (
    leftKeys.length === keys(right).length &&
    leftKeys.every(
      (key) => Object.hasOwn(right, key) && isSameValue(left[key], right[key]),
    )
  )
}

/**
 * 用新快照替换引用。编号按位置（keyed map 按排序后的键）对应，同一位置上
 * 任一字段变化（metadata、评分、名称、位置、图片……）都换成新条目，没变的沿用
 * 原对象；整份快照相同时返回原数组，不触发无效刷新。
 */
export const reconcileReferences = (
  current: ReferenceChunk[],
  incoming: ReferenceChunk[],
): ReferenceChunk[] => {
  let changed = incoming.length !== current.length
  const next = incoming.map((chunk, index) => {
    const previous = current[index]
    if (previous !== undefined && isSameValue(previous, chunk)) return previous
    changed = true
    return chunk
  })
  return changed ? next : current
}

/**
 * 一帧之后回答应持有的引用。只有权威帧（未失败的终帧）能把引用清空；增量帧的
 * 空快照表示没提供，保留已有引用，等终帧为准。
 */
export const mergeFrameReferences = (
  current: ReferenceChunk[],
  incoming: ReferenceChunk[] | null,
  authoritative: boolean,
): ReferenceChunk[] => {
  if (!incoming) return current
  if (incoming.length === 0 && !authoritative) return current
  return reconcileReferences(current, incoming)
}
