/**
 * 团队模块共享工具函数
 */

import { formatRelativeTime } from '@/lib/utils'
import type { TimeFormat } from '@/stores/team'

/** 将 delta_seconds 转换为可读的相对时间 */
export const formatDeltaSeconds = (deltaSeconds: number): string => {
  if (deltaSeconds < 60) return '刚刚'
  if (deltaSeconds < 3600) return `${Math.floor(deltaSeconds / 60)} 分钟前`
  if (deltaSeconds < 86400) return `${Math.floor(deltaSeconds / 3600)} 小时前`
  if (deltaSeconds < 2592000) return `${Math.floor(deltaSeconds / 86400)} 天前`
  return `${Math.floor(deltaSeconds / 2592000)} 个月前`
}

/** 格式化时间，支持 update_date 字符串和 delta_seconds */
export const formatTeamTime = (
  updateDate: string | undefined,
  deltaSeconds: number | undefined,
  format: TimeFormat
): string => {
  if (format === 'relative' && deltaSeconds !== undefined) {
    return formatDeltaSeconds(deltaSeconds)
  }

  if (!updateDate) return '未知时间'

  const date = new Date(updateDate)
  if (isNaN(date.getTime())) return updateDate

  switch (format) {
    case 'detailed':
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    case 'compact':
      return date.toLocaleDateString('zh-CN')
    case 'relative':
      return formatRelativeTime(date.getTime())
    default:
      return date.toLocaleString('zh-CN')
  }
}
