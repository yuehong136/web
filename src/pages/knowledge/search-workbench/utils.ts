import type { TFunction } from 'i18next'

import { formatRetrievalScore } from '@/lib/knowledge/retrieval-score'
import { getCurrentLanguage } from '@/locales/i18n'

import type { RetrievalResultView } from './types'

// 检索测试用于调参，保留一位小数，便于对照相似度阈值比较相近的分值
const SCORE_FRACTION_DIGITS = 1

/** 有效评分按界面语言显示为百分比（0 显示 0.0%）；null（缺失或无效）显示“不可用”。 */
export const formatResultScore = (
  score: number | null,
  t: TFunction,
): string =>
  score === null
    ? t('knowledge.search.scoreUnavailable')
    : formatRetrievalScore(score, getCurrentLanguage(), SCORE_FRACTION_DIGITS)

export const hasUnavailableScore = (result: RetrievalResultView): boolean =>
  Object.values(result.scores).some((score) => score === null)
