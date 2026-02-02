/**
 * 对话相关的工具函数
 */

// 对话日期分组类型
export type ConversationDateGroup = '今天' | '昨天' | '最近 7 天' | '更早'

// 简化的分组类型（不包含"昨天"）
export type ConversationDateGroupSimple = '今天' | '最近 7 天' | '更早'

/**
 * 获取对话的日期分组
 * @param timestamp 时间戳（秒或毫秒）或日期字符串
 * @param includeYesterday 是否包含"昨天"分组，默认 true
 */
export const getConversationDateGroup = (
  timestamp?: number | string,
  includeYesterday: boolean = true
): ConversationDateGroup | ConversationDateGroupSimple => {
  if (!timestamp) return '更早'
  
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
    return '今天'
  } else if (includeYesterday && dateOnly.getTime() === yesterday.getTime()) {
    return '昨天'
  } else if (dateOnly >= lastWeek) {
    return '最近 7 天'
  } else {
    return '更早'
  }
}

/**
 * 按日期分组对话
 */
export interface GroupedConversations<T = any> {
  group: ConversationDateGroup | ConversationDateGroupSimple
  conversations: T[]
}

/**
 * 将对话列表按日期分组
 * @param conversations 对话列表
 * @param options 配置选项
 */
export const groupConversationsByDate = <T extends { update_time?: number | string; update_date?: number | string }>(
  conversations: T[],
  options: {
    includeYesterday?: boolean
    /** 获取时间戳的字段名，默认使用 update_time 或 update_date */
    getTimestamp?: (conv: T) => number | string | undefined
  } = {}
): GroupedConversations<T>[] => {
  const { includeYesterday = true, getTimestamp } = options
  
  // 定义分组顺序
  const groupOrder = includeYesterday
    ? ['今天', '昨天', '最近 7 天', '更早'] as const
    : ['今天', '最近 7 天', '更早'] as const
  
  const groups: Record<string, T[]> = {}
  groupOrder.forEach(g => { groups[g] = [] })
  
  // 先按更新时间排序（最新的在前）
  const sorted = [...conversations].sort((a, b) => {
    const getTime = (conv: T) => {
      const ts = getTimestamp ? getTimestamp(conv) : (conv.update_time || conv.update_date)
      if (!ts) return 0
      if (typeof ts === 'string') return new Date(ts).getTime()
      return ts > 1000000000000 ? ts : ts * 1000
    }
    return getTime(b) - getTime(a)
  })
  
  // 分组
  sorted.forEach(conv => {
    const ts = getTimestamp ? getTimestamp(conv) : (conv.update_time || conv.update_date)
    const group = getConversationDateGroup(ts, includeYesterday)
    groups[group].push(conv)
  })
  
  // 返回非空分组
  const result: GroupedConversations<T>[] = []
  groupOrder.forEach(groupName => {
    if (groups[groupName].length > 0) {
      result.push({
        group: groupName,
        conversations: groups[groupName],
      })
    }
  })
  
  return result
}

/**
 * 格式化相对时间
 */
export const formatRelativeTime = (timestamp?: number | string): string => {
  if (!timestamp) return ''
  
  const date = typeof timestamp === 'number' 
    ? new Date(timestamp > 1000000000000 ? timestamp : timestamp * 1000) 
    : new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays}天前`
  
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
