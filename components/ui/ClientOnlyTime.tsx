import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface ClientOnlyTimeProps {
  dateString: string
  className?: string
}

/**
 * 客户端专用时间组件，避免hydration error
 * 在服务器端显示固定格式，客户端显示相对时间
 */
export function ClientOnlyTime({ dateString, className }: ClientOnlyTimeProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      
      if (!isClient) {
        // 服务器端使用固定格式，避免hydration error
        return date.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      }
      
      // 客户端使用相对时间
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: zhCN,
      })
    } catch (error) {
      return '未知时间'
    }
  }

  return (
    <span className={className}>
      {formatDate(dateString)}
    </span>
  )
}
