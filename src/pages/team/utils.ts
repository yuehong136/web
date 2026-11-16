/**
 * 团队模块共享工具函数
 */

import {
  formatRelativeTime,
  formatTimestampCompact,
  formatTimestampDetailed,
} from '@/lib/utils'
import type { TimeFormat } from '@/stores/team'

/**
 * Formats a member or team update time in the current product language.
 * Returns null when the server sent no usable time.
 */
export const formatTeamTime = (
  updateDate: string | undefined,
  deltaSeconds: number | undefined,
  format: TimeFormat,
): string | null => {
  if (format === 'relative' && deltaSeconds !== undefined)
    return formatRelativeTime(Date.now() - deltaSeconds * 1000)
  if (!updateDate) return null
  const time = new Date(updateDate).getTime()
  if (Number.isNaN(time)) return updateDate
  if (format === 'compact') return formatTimestampCompact(time)
  if (format === 'relative') return formatRelativeTime(time)
  return formatTimestampDetailed(time)
}
