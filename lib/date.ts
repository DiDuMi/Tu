/**
 * 格式化日期为YYYY-MM-DD格式
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * 格式化日期时间为YYYY-MM-DD HH:MM:SS格式
 * @param date 日期对象或日期字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化为相对时间（如：刚刚、5分钟前、1小时前等）
 * @param date 日期对象或日期字符串
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  
  // 转换为秒
  const diffSec = Math.floor(diffMs / 1000)
  
  if (diffSec < 60) {
    return '刚刚'
  }
  
  // 转换为分钟
  const diffMin = Math.floor(diffSec / 60)
  
  if (diffMin < 60) {
    return `${diffMin}分钟前`
  }
  
  // 转换为小时
  const diffHour = Math.floor(diffMin / 60)
  
  if (diffHour < 24) {
    return `${diffHour}小时前`
  }
  
  // 转换为天
  const diffDay = Math.floor(diffHour / 24)
  
  if (diffDay < 30) {
    return `${diffDay}天前`
  }
  
  // 转换为月
  const diffMonth = Math.floor(diffDay / 30)
  
  if (diffMonth < 12) {
    return `${diffMonth}个月前`
  }
  
  // 转换为年
  const diffYear = Math.floor(diffMonth / 12)
  return `${diffYear}年前`
}

/**
 * 获取日期范围
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 日期范围数组
 */
export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = []
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return dates
}

/**
 * 检查日期是否为今天
 * @param date 日期对象或日期字符串
 * @returns 是否为今天
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  )
}

/**
 * 检查日期是否为昨天
 * @param date 日期对象或日期字符串
 * @returns 是否为昨天
 */
export function isYesterday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  return (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  )
}
