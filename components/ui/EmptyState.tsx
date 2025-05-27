import React from 'react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'primary' | 'outline'
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  size = 'md'
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: 'py-12',
      icon: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-sm'
    },
    md: {
      container: 'py-20',
      icon: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-base'
    },
    lg: {
      container: 'py-32',
      icon: 'h-20 w-20',
      title: 'text-2xl',
      description: 'text-lg'
    }
  }

  const defaultIcon = (
    <svg
      className={cn('text-gray-300 dark:text-dark-muted', sizeClasses[size].icon)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )

  return (
    <div className={cn('text-center', sizeClasses[size].container, className)}>
      <div className="flex justify-center mb-4">
        {icon || defaultIcon}
      </div>
      <h3 className={cn('font-semibold text-gray-900 dark:text-dark-text mb-2', sizeClasses[size].title)}>
        {title}
      </h3>
      {description && (
        <p className={cn('text-gray-500 dark:text-dark-muted mb-6 max-w-md mx-auto', sizeClasses[size].description)}>
          {description}
        </p>
      )}
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

// 预设的空状态组件
export function NoSearchResults({ keyword, onReset }: { keyword?: string; onReset?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="h-16 w-16 text-gray-300 dark:text-dark-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title={keyword ? `没有找到与 "${keyword}" 相关的内容` : '暂无搜索结果'}
      description={keyword ? '请尝试使用其他关键词，或减少筛选条件' : '输入关键词开始搜索'}
      action={onReset ? {
        label: '清除筛选',
        onClick: onReset,
        variant: 'outline'
      } : undefined}
    />
  )
}

export function NoContent({ onCreateContent }: { onCreateContent?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="h-16 w-16 text-gray-300 dark:text-dark-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      }
      title="还没有任何内容"
      description="成为第一个发布内容的用户，开始分享您的知识和见解"
      action={onCreateContent ? {
        label: '创建内容',
        onClick: onCreateContent,
        variant: 'primary'
      } : undefined}
    />
  )
}

export function NoFavorites({ onBrowseContent }: { onBrowseContent?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="h-16 w-16 text-gray-300 dark:text-dark-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      }
      title="还没有收藏任何内容"
      description="搜索内容并点击心形图标来收藏您喜欢的内容"
      action={onBrowseContent ? {
        label: '搜索内容',
        onClick: onBrowseContent,
        variant: 'primary'
      } : undefined}
    />
  )
}

export function ErrorState({
  title = '出现了一些问题',
  description = '请稍后重试，或联系技术支持',
  onRetry
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState
      icon={
        <svg
          className="h-16 w-16 text-red-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      }
      title={title}
      description={description}
      action={onRetry ? {
        label: '重试',
        onClick: onRetry,
        variant: 'outline'
      } : undefined}
    />
  )
}
