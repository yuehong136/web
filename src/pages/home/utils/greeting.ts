/**
 * 获取问候语
 */
export const getGreetingKey = (): string => {
  const hour = new Date().getHours()
  if (hour < 6) return 'home.greeting.beforeDawn'
  if (hour < 9) return 'home.greeting.morning'
  if (hour < 12) return 'home.greeting.forenoon'
  if (hour < 14) return 'home.greeting.noon'
  if (hour < 18) return 'home.greeting.afternoon'
  if (hour < 22) return 'home.greeting.evening'
  return 'home.greeting.lateNight'
}
