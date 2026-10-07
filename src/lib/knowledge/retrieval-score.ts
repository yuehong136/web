/**
 * 检索匹配评分：检索结果 chunk 的 similarity / vector_similarity / term_similarity
 * 是检索阶段的排序分（对话引用与知识库检索测试共用），后端可能不给
 * （null / undefined，例如存储未计算该分项），也可能给出异常值。
 * 只有 [0, 1] 内的有限数字算有效评分，0 是真实评分；其余一律视为不可用，
 * 不能按 0 分或“低相关”展示。
 */

// 加权求和的浮点误差可能让满分略超 1（如 1.0000000000000002），按边界值处理
const BOUNDARY_TOLERANCE = 1e-9

/** 有效评分返回 [0, 1] 内的数值；缺失、非数字、NaN、无穷或超出范围返回 null。 */
export function readRetrievalScore(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  if (value < -BOUNDARY_TOLERANCE || value > 1 + BOUNDARY_TOLERANCE) return null
  return Math.min(1, Math.max(0, value))
}

/**
 * 按界面语言格式化为百分比，固定 `fractionDigits` 位小数（默认整数）：
 * 0.82 → “82%”；`fractionDigits` 为 1 时 0.824 → “82.4%”。
 */
export function formatRetrievalScore(
  score: number,
  locale: string,
  fractionDigits = 0,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(score)
}
