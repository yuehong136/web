/**
 * 对话相关的工具函数
 */

export enum ConversationDateGroup {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_SEVEN_DAYS = 'lastSevenDays',
  EARLIER = 'earlier',
}

/**
 * 获取对话的日期分组
 * @param timestamp 时间戳（秒或毫秒）或日期字符串
 * @param includeYesterday 是否包含"昨天"分组，默认 true
 */
export const getConversationDateGroup = (
  timestamp?: number | string,
  includeYesterday: boolean = true,
): ConversationDateGroup => {
  if (!timestamp) return ConversationDateGroup.EARLIER

  // 处理时间戳格式（毫秒或秒）
  let time: number
  if (typeof timestamp === 'string') {
    time = new Date(timestamp).getTime()
  } else {
    time = timestamp > 1000000000000 ? timestamp : timestamp * 1000
  }

  const date = new Date(time)
  const now = new Date()

  // 获取今天和昨天的日期（忽略时间）
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (dateOnly.getTime() >= today.getTime()) {
    return ConversationDateGroup.TODAY
  } else if (includeYesterday && dateOnly.getTime() === yesterday.getTime()) {
    return ConversationDateGroup.YESTERDAY
  } else if (dateOnly >= lastWeek) {
    return ConversationDateGroup.LAST_SEVEN_DAYS
  } else {
    return ConversationDateGroup.EARLIER
  }
}

/**
 * 按日期分组对话
 */
export interface GroupedConversations<T = unknown> {
  group: ConversationDateGroup
  conversations: T[]
}

/**
 * 将对话列表按日期分组
 * @param conversations 对话列表
 * @param options 配置选项
 */
export const groupConversationsByDate = <
  T extends {
    update_time?: number | string
    update_date?: number | string
  },
>(
  conversations: T[],
  options: {
    includeYesterday?: boolean
    /** 获取时间戳的字段名，默认使用 update_time 或 update_date */
    getTimestamp?: (conv: T) => number | string | undefined
  } = {},
): GroupedConversations<T>[] => {
  const { includeYesterday = true, getTimestamp } = options

  // 定义分组顺序
  const groupOrder = includeYesterday
    ? [
        ConversationDateGroup.TODAY,
        ConversationDateGroup.YESTERDAY,
        ConversationDateGroup.LAST_SEVEN_DAYS,
        ConversationDateGroup.EARLIER,
      ]
    : [
        ConversationDateGroup.TODAY,
        ConversationDateGroup.LAST_SEVEN_DAYS,
        ConversationDateGroup.EARLIER,
      ]

  const groups = new Map<ConversationDateGroup, T[]>(
    groupOrder.map((group) => [group, []]),
  )

  // 先按更新时间排序（最新的在前）
  const sorted = [...conversations].sort((a, b) => {
    const getTime = (conv: T) => {
      const ts = getTimestamp
        ? getTimestamp(conv)
        : conv.update_time || conv.update_date
      if (!ts) return 0
      if (typeof ts === 'string') return new Date(ts).getTime()
      return ts > 1000000000000 ? ts : ts * 1000
    }
    return getTime(b) - getTime(a)
  })

  // 分组
  sorted.forEach((conv) => {
    const ts = getTimestamp
      ? getTimestamp(conv)
      : conv.update_time || conv.update_date
    const group = getConversationDateGroup(ts, includeYesterday)
    groups.get(group)?.push(conv)
  })

  // 返回非空分组
  const result: GroupedConversations<T>[] = []
  groupOrder.forEach((groupName) => {
    const conversationsInGroup = groups.get(groupName) ?? []
    if (conversationsInGroup.length > 0) {
      result.push({
        group: groupName,
        conversations: conversationsInGroup,
      })
    }
  })

  return result
}

/**
 * 格式化相对时间
 */
export const formatRelativeTime = (
  timestamp: number | string | undefined,
  options: {
    locale?: string
    format?: (key: string, count?: number) => string
  } = {},
): string => {
  if (!timestamp) return ''

  const date =
    typeof timestamp === 'number'
      ? new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000)
      : new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const format =
    options.format ??
    ((key: string, count?: number) => {
      const legacyChinese = {
        justNow: '刚刚',
        minutesAgo: `${count ?? 0}分钟前`,
        hoursAgo: `${count ?? 0}小时前`,
        yesterday: '昨天',
        daysAgo: `${count ?? 0}天前`,
      }
      return legacyChinese[key as keyof typeof legacyChinese]
    })

  if (diffMinutes < 1) return format('justNow')
  if (diffMinutes < 60) return format('minutesAgo', diffMinutes)
  if (diffHours < 24) return format('hoursAgo', diffHours)
  if (diffDays === 1) return format('yesterday')
  if (diffDays < 7) return format('daysAgo', diffDays)

  return date.toLocaleDateString(options.locale ?? 'zh-CN', {
    month: 'short',
    day: 'numeric',
  })
}
