import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'dots' | 'pulse' | 'bounce'
  className?: string
  text?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  className,
  text 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <div className="flex space-x-1">
          <div className={cn('bg-primary-500 rounded-full animate-bounce', sizeClasses[size])} style={{ animationDelay: '0ms' }}></div>
          <div className={cn('bg-primary-500 rounded-full animate-bounce', sizeClasses[size])} style={{ animationDelay: '150ms' }}></div>
          <div className={cn('bg-primary-500 rounded-full animate-bounce', sizeClasses[size])} style={{ animationDelay: '300ms' }}></div>
        </div>
        {text && (
          <p className={cn('mt-4 text-gray-600 dark:text-dark-muted', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <div className={cn('bg-primary-500 rounded-full animate-pulse', sizeClasses[size])}></div>
        {text && (
          <p className={cn('mt-4 text-gray-600 dark:text-dark-muted animate-pulse', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    )
  }

  if (variant === 'bounce') {
    return (
      <div className={cn('flex flex-col items-center justify-center', className)}>
        <div className={cn('bg-primary-500 rounded-full animate-bounce', sizeClasses[size])}></div>
        {text && (
          <p className={cn('mt-4 text-gray-600 dark:text-dark-muted', textSizeClasses[size])}>
            {text}
          </p>
        )}
      </div>
    )
  }

  // Default spinner
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      <div className={cn('animate-spin rounded-full border-2 border-gray-300 border-t-primary-500', sizeClasses[size])}></div>
      {text && (
        <p className={cn('mt-4 text-gray-600 dark:text-dark-muted', textSizeClasses[size])}>
          {text}
        </p>
      )}
    </div>
  )
}

// 页面级加载组件
export function PageLoading({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" variant="dots" text={text} />
    </div>
  )
}

// 内容加载骨架屏
export function ContentSkeleton() {
  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-dark-border"></div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 dark:bg-dark-border rounded-full w-16"></div>
          <div className="h-3 bg-gray-200 dark:bg-dark-border rounded-full w-20"></div>
        </div>
        <div className="space-y-2 mb-4">
          <div className="h-5 bg-gray-200 dark:bg-dark-border rounded w-full"></div>
          <div className="h-5 bg-gray-200 dark:bg-dark-border rounded w-3/4"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-5/6"></div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-12"></div>
            <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-12"></div>
            <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-12"></div>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-dark-border rounded w-16"></div>
        </div>
      </div>
    </div>
  )
}

// 网格骨架屏
export function ContentGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <ContentSkeleton key={index} />
      ))}
    </div>
  )
}
