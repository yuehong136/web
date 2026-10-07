import {
  extractReferencesFromSSEData,
  type ReferenceChunk,
} from '@/utils/reference-replacer'

/**
 * Home 应用模式的引用：流式帧的合并与历史回答的对齐（MultiRAG 旧版
 * `/v1/conversation/completion` 与 `/v1/conversation/get`）。
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

/**
 * 历史回答的引用，下标与 `messages` 一致；用户消息与对不上的回答为 undefined。
 *
 * 历史消息不带引用，引用在会话级平行数组 `reference[]` 里，每次成功完成的
 * completion 追加一组；停止、失败的回合不追加，却会随下一次请求的历史写回
 * `message`，重新生成又只追加不截断。所以只在"非开场白的助手消息数 = 引用组数"
 * 时按顺序对应，对不上一律不挂（宁可不显示也不显示错）。开场白是位于首条的助手
 * 消息；其他客户端写回的历史可能没有开场白，首条是用户消息时不跳过任何回答。
 * 计数相等只是必要条件：重新生成多出的一组与失败回合多出的一条恰好抵消时仍会错位，
 * 根治需要服务端把引用嵌进消息。
 */
export const alignHistoryReferences = (
  messages: readonly ConversationHistoryMessage[],
  groups: unknown,
): Array<ReferenceChunk[] | undefined> => {
  const aligned: Array<ReferenceChunk[] | undefined> = messages.map(
    () => undefined,
  )
  if (!Array.isArray(groups)) return aligned
  const answers = messages.flatMap((message, index) =>
    index > 0 && message?.role === 'assistant' ? [index] : [],
  )
  if (answers.length !== groups.length) return aligned
  answers.forEach((messageIndex, groupIndex) => {
    const group: unknown = groups[groupIndex]
    aligned[messageIndex] = isRecord(group)
      ? extractReferencesFromSSEData({ reference: group })
      : []
  })
  return aligned
}

const CITATION_MARKER = /\[ID:\d+\]/

/** 正文是否带有 `[ID:n]` 引用标记（不论能否解析到引用） */
export const hasCitationMarkers = (content: string): boolean =>
  CITATION_MARKER.test(content)
