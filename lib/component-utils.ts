/**
 * 组件工具函数
 * 提供通用的组件辅助函数
 */

import { ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并类名
 * 使用clsx和tailwind-merge合并类名，解决Tailwind类名冲突问题
 * @param inputs 类名数组
 * @returns 合并后的类名字符串
 * @example
 * // 返回 "p-4 bg-blue-500"
 * cn("p-4", "bg-blue-500")
 * // 返回 "p-4 bg-blue-500"，而不是 "p-2 p-4 bg-blue-500"
 * cn("p-2", "p-4", "bg-blue-500")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param options 格式化选项
 * @returns 格式化后的日期字符串
 * @example
 * // 返回 "2023-01-01"
 * formatDate("2023-01-01T00:00:00Z")
 * // 返回 "2023年1月1日"
 * formatDate("2023-01-01T00:00:00Z", { year: 'numeric', month: 'long', day: 'numeric' })
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }
): string {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return ''
  
  return new Intl.DateTimeFormat('zh-CN', options).format(d)
}

/**
 * 格式化时间
 * @param date 日期字符串或Date对象
 * @returns 格式化后的时间字符串
 * @example
 * // 返回 "12:00:00"
 * formatTime("2023-01-01T12:00:00Z")
 */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return ''
  
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
}

/**
 * 格式化日期时间
 * @param date 日期字符串或Date对象
 * @returns 格式化后的日期时间字符串
 * @example
 * // 返回 "2023-01-01 12:00:00"
 * formatDateTime("2023-01-01T12:00:00Z")
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return ''
  
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
}

/**
 * 格式化相对时间
 * @param date 日期字符串或Date对象
 * @returns 格式化后的相对时间字符串
 * @example
 * // 返回 "刚刚"、"5分钟前"、"1小时前"、"昨天"、"2天前"、"1周前"、"1个月前"、"1年前"等
 * formatRelativeTime("2023-01-01T12:00:00Z")
 */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(d.getTime())) return ''
  
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  // 转换为秒
  const seconds = Math.floor(diff / 1000)
  
  // 小于1分钟
  if (seconds < 60) {
    return '刚刚'
  }
  
  // 转换为分钟
  const minutes = Math.floor(seconds / 60)
  
  // 小于1小时
  if (minutes < 60) {
    return `${minutes}分钟前`
  }
  
  // 转换为小时
  const hours = Math.floor(minutes / 60)
  
  // 小于1天
  if (hours < 24) {
    return `${hours}小时前`
  }
  
  // 转换为天
  const days = Math.floor(hours / 24)
  
  // 小于1周
  if (days < 7) {
    return days === 1 ? '昨天' : `${days}天前`
  }
  
  // 转换为周
  const weeks = Math.floor(days / 7)
  
  // 小于1个月
  if (weeks < 4) {
    return `${weeks}周前`
  }
  
  // 转换为月
  const months = Math.floor(days / 30)
  
  // 小于1年
  if (months < 12) {
    return `${months}个月前`
  }
  
  // 转换为年
  const years = Math.floor(days / 365)
  
  return `${years}年前`
}

/**
 * 格式化数字
 * @param num 数字
 * @param options 格式化选项
 * @returns 格式化后的数字字符串
 * @example
 * // 返回 "1,234.56"
 * formatNumber(1234.56)
 * // 返回 "¥1,234.56"
 * formatNumber(1234.56, { style: 'currency', currency: 'CNY' })
 */
export function formatNumber(
  num: number | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string {
  if (num === null || num === undefined) return ''
  
  return new Intl.NumberFormat('zh-CN', options).format(num)
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的文件大小字符串
 * @example
 * // 返回 "1.23 KB"
 * formatFileSize(1234)
 */
export function formatFileSize(bytes: number | null | undefined, decimals: number = 2): string {
  if (bytes === null || bytes === undefined || bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * 截断文本
 * @param text 文本
 * @param length 最大长度
 * @param suffix 后缀
 * @returns 截断后的文本
 * @example
 * // 返回 "这是一个很长的文本..."
 * truncateText("这是一个很长的文本，需要被截断", 10)
 */
export function truncateText(
  text: string | null | undefined,
  length: number = 50,
  suffix: string = '...'
): string {
  if (!text) return ''
  
  if (text.length <= length) return text
  
  return text.substring(0, length) + suffix
}
