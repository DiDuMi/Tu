import React from 'react'
import { toast as sonnerToast, Toaster as SonnerToaster } from 'sonner'

export interface ToastProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * 显示Toast通知
 */
export function toast({
  title,
  description,
  variant = 'default',
  duration = 5000,
  action,
}: ToastProps) {
  const options: any = {
    duration,
    className: getVariantClass(variant),
  }

  if (action) {
    options.action = {
      label: action.label,
      onClick: action.onClick,
    }
  }

  if (title && description) {
    sonnerToast(title, {
      description,
      ...options,
    })
  } else {
    sonnerToast(title || description || '', options)
  }
}

/**
 * 获取变体对应的CSS类名
 */
function getVariantClass(variant: ToastProps['variant']) {
  switch (variant) {
    case 'destructive':
      return 'bg-red-100 text-red-900 border-red-200'
    case 'success':
      return 'bg-green-100 text-green-900 border-green-200'
    case 'warning':
      return 'bg-yellow-100 text-yellow-900 border-yellow-200'
    default:
      return 'bg-white text-gray-900 border-gray-200'
  }
}

/**
 * Toast容器组件
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        className: 'border rounded-md shadow-md',
        style: {
          padding: '12px',
        },
      }}
    />
  )
}
