import React, { useState } from 'react'
import { Button } from './Button'
import { Alert } from './Alert'

interface ErrorWithRetryProps {
  title?: string
  message: string
  onRetry?: () => void
  onBack?: () => void
  showBackButton?: boolean
  showRetryButton?: boolean
  retryText?: string
  backText?: string
}

/**
 * 带有重试功能的错误提示组件
 */
export function ErrorWithRetry({
  title = '出错了',
  message,
  onRetry,
  onBack,
  showBackButton = true,
  showRetryButton = true,
  retryText = '重试',
  backText = '返回'
}: ErrorWithRetryProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    if (!onRetry) return
    
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <Alert variant="destructive" className="mb-6 max-w-lg w-full">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm">{message}</p>
        </div>
      </Alert>
      
      <div className="flex gap-4">
        {showRetryButton && onRetry && (
          <Button 
            onClick={handleRetry} 
            disabled={isRetrying}
            className="min-w-[100px]"
          >
            {isRetrying ? '重试中...' : retryText}
          </Button>
        )}
        
        {showBackButton && onBack && (
          <Button 
            variant="outline" 
            onClick={onBack}
            className="min-w-[100px]"
          >
            {backText}
          </Button>
        )}
      </div>
    </div>
  )
}
