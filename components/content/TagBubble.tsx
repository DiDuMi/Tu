import Link from 'next/link'
import React from 'react'

import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'

interface TagBubbleProps {
  tag: {
    name: string
    slug: string
    count?: number
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'solid'
}

// 预定义的颜色样式映射，确保Tailwind CSS能正确识别
const colorStyles = {
  blue: {
    100: 'bg-blue-100 text-blue-900 hover:bg-blue-50',
    200: 'bg-blue-200 text-blue-900 hover:bg-blue-100',
    300: 'bg-blue-300 text-blue-900 hover:bg-blue-200',
    400: 'bg-blue-400 text-white hover:bg-blue-300',
    500: 'bg-blue-500 text-white hover:bg-blue-400',
    600: 'bg-blue-600 text-white hover:bg-blue-500',
    700: 'bg-blue-700 text-white hover:bg-blue-600',
    800: 'bg-blue-800 text-white hover:bg-blue-700',
    900: 'bg-blue-900 text-white hover:bg-blue-800',
  },
  green: {
    100: 'bg-green-100 text-green-900 hover:bg-green-50',
    200: 'bg-green-200 text-green-900 hover:bg-green-100',
    300: 'bg-green-300 text-green-900 hover:bg-green-200',
    400: 'bg-green-400 text-white hover:bg-green-300',
    500: 'bg-green-500 text-white hover:bg-green-400',
    600: 'bg-green-600 text-white hover:bg-green-500',
    700: 'bg-green-700 text-white hover:bg-green-600',
    800: 'bg-green-800 text-white hover:bg-green-700',
    900: 'bg-green-900 text-white hover:bg-green-800',
  },
  purple: {
    100: 'bg-purple-100 text-purple-900 hover:bg-purple-50',
    200: 'bg-purple-200 text-purple-900 hover:bg-purple-100',
    300: 'bg-purple-300 text-purple-900 hover:bg-purple-200',
    400: 'bg-purple-400 text-white hover:bg-purple-300',
    500: 'bg-purple-500 text-white hover:bg-purple-400',
    600: 'bg-purple-600 text-white hover:bg-purple-500',
    700: 'bg-purple-700 text-white hover:bg-purple-600',
    800: 'bg-purple-800 text-white hover:bg-purple-700',
    900: 'bg-purple-900 text-white hover:bg-purple-800',
  },
  pink: {
    100: 'bg-pink-100 text-pink-900 hover:bg-pink-50',
    200: 'bg-pink-200 text-pink-900 hover:bg-pink-100',
    300: 'bg-pink-300 text-pink-900 hover:bg-pink-200',
    400: 'bg-pink-400 text-white hover:bg-pink-300',
    500: 'bg-pink-500 text-white hover:bg-pink-400',
    600: 'bg-pink-600 text-white hover:bg-pink-500',
    700: 'bg-pink-700 text-white hover:bg-pink-600',
    800: 'bg-pink-800 text-white hover:bg-pink-700',
    900: 'bg-pink-900 text-white hover:bg-pink-800',
  },
  indigo: {
    100: 'bg-indigo-100 text-indigo-900 hover:bg-indigo-50',
    200: 'bg-indigo-200 text-indigo-900 hover:bg-indigo-100',
    300: 'bg-indigo-300 text-indigo-900 hover:bg-indigo-200',
    400: 'bg-indigo-400 text-white hover:bg-indigo-300',
    500: 'bg-indigo-500 text-white hover:bg-indigo-400',
    600: 'bg-indigo-600 text-white hover:bg-indigo-500',
    700: 'bg-indigo-700 text-white hover:bg-indigo-600',
    800: 'bg-indigo-800 text-white hover:bg-indigo-700',
    900: 'bg-indigo-900 text-white hover:bg-indigo-800',
  },
  red: {
    100: 'bg-red-100 text-red-900 hover:bg-red-50',
    200: 'bg-red-200 text-red-900 hover:bg-red-100',
    300: 'bg-red-300 text-red-900 hover:bg-red-200',
    400: 'bg-red-400 text-white hover:bg-red-300',
    500: 'bg-red-500 text-white hover:bg-red-400',
    600: 'bg-red-600 text-white hover:bg-red-500',
    700: 'bg-red-700 text-white hover:bg-red-600',
    800: 'bg-red-800 text-white hover:bg-red-700',
    900: 'bg-red-900 text-white hover:bg-red-800',
  },
  yellow: {
    100: 'bg-yellow-100 text-yellow-900 hover:bg-yellow-50',
    200: 'bg-yellow-200 text-yellow-900 hover:bg-yellow-100',
    300: 'bg-yellow-300 text-yellow-900 hover:bg-yellow-200',
    400: 'bg-yellow-400 text-yellow-900 hover:bg-yellow-300',
    500: 'bg-yellow-500 text-yellow-900 hover:bg-yellow-400',
    600: 'bg-yellow-600 text-white hover:bg-yellow-500',
    700: 'bg-yellow-700 text-white hover:bg-yellow-600',
    800: 'bg-yellow-800 text-white hover:bg-yellow-700',
    900: 'bg-yellow-900 text-white hover:bg-yellow-800',
  },
  teal: {
    100: 'bg-teal-100 text-teal-900 hover:bg-teal-50',
    200: 'bg-teal-200 text-teal-900 hover:bg-teal-100',
    300: 'bg-teal-300 text-teal-900 hover:bg-teal-200',
    400: 'bg-teal-400 text-white hover:bg-teal-300',
    500: 'bg-teal-500 text-white hover:bg-teal-400',
    600: 'bg-teal-600 text-white hover:bg-teal-500',
    700: 'bg-teal-700 text-white hover:bg-teal-600',
    800: 'bg-teal-800 text-white hover:bg-teal-700',
    900: 'bg-teal-900 text-white hover:bg-teal-800',
  },
  orange: {
    100: 'bg-orange-100 text-orange-900 hover:bg-orange-50',
    200: 'bg-orange-200 text-orange-900 hover:bg-orange-100',
    300: 'bg-orange-300 text-orange-900 hover:bg-orange-200',
    400: 'bg-orange-400 text-white hover:bg-orange-300',
    500: 'bg-orange-500 text-white hover:bg-orange-400',
    600: 'bg-orange-600 text-white hover:bg-orange-500',
    700: 'bg-orange-700 text-white hover:bg-orange-600',
    800: 'bg-orange-800 text-white hover:bg-orange-700',
    900: 'bg-orange-900 text-white hover:bg-orange-800',
  },
  cyan: {
    100: 'bg-cyan-100 text-cyan-900 hover:bg-cyan-50',
    200: 'bg-cyan-200 text-cyan-900 hover:bg-cyan-100',
    300: 'bg-cyan-300 text-cyan-900 hover:bg-cyan-200',
    400: 'bg-cyan-400 text-white hover:bg-cyan-300',
    500: 'bg-cyan-500 text-white hover:bg-cyan-400',
    600: 'bg-cyan-600 text-white hover:bg-cyan-500',
    700: 'bg-cyan-700 text-white hover:bg-cyan-600',
    800: 'bg-cyan-800 text-white hover:bg-cyan-700',
    900: 'bg-cyan-900 text-white hover:bg-cyan-800',
  },
} as const

// 计数样式映射
const countStyles = {
  blue: {
    light: 'bg-blue-100 text-blue-800',
    medium: 'bg-blue-200 text-blue-900',
    dark: 'bg-blue-800 text-white',
  },
  green: {
    light: 'bg-green-100 text-green-800',
    medium: 'bg-green-200 text-green-900',
    dark: 'bg-green-800 text-white',
  },
  purple: {
    light: 'bg-purple-100 text-purple-800',
    medium: 'bg-purple-200 text-purple-900',
    dark: 'bg-purple-800 text-white',
  },
  pink: {
    light: 'bg-pink-100 text-pink-800',
    medium: 'bg-pink-200 text-pink-900',
    dark: 'bg-pink-800 text-white',
  },
  indigo: {
    light: 'bg-indigo-100 text-indigo-800',
    medium: 'bg-indigo-200 text-indigo-900',
    dark: 'bg-indigo-800 text-white',
  },
  red: {
    light: 'bg-red-100 text-red-800',
    medium: 'bg-red-200 text-red-900',
    dark: 'bg-red-800 text-white',
  },
  yellow: {
    light: 'bg-yellow-100 text-yellow-800',
    medium: 'bg-yellow-200 text-yellow-900',
    dark: 'bg-yellow-800 text-white',
  },
  teal: {
    light: 'bg-teal-100 text-teal-800',
    medium: 'bg-teal-200 text-teal-900',
    dark: 'bg-teal-800 text-white',
  },
  orange: {
    light: 'bg-orange-100 text-orange-800',
    medium: 'bg-orange-200 text-orange-900',
    dark: 'bg-orange-800 text-white',
  },
  cyan: {
    light: 'bg-cyan-100 text-cyan-800',
    medium: 'bg-cyan-200 text-cyan-900',
    dark: 'bg-cyan-800 text-white',
  },
} as const

// 生成基于标签名的稳定随机颜色
const getRandomColor = (name: string): keyof typeof colorStyles => {
  // 使用标签名生成稳定的哈希值
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }

  // 定义彩色调色板
  const colors: (keyof typeof colorStyles)[] = [
    'blue', 'green', 'purple', 'pink', 'indigo', 'red', 'yellow', 'teal', 'orange', 'cyan'
  ]

  return colors[Math.abs(hash) % colors.length]
}

const TagBubble: React.FC<TagBubbleProps> = ({
  tag,
  className = '',
  size = 'md',
  variant = 'default'
}) => {
  // 根据大小设置样式
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  }

  // 获取标签的随机颜色
  const baseColor = getRandomColor(tag.name)
  const count = tag.count || 0

  // 根据标签数量确定颜色深度
  const getColorIntensity = (count: number): keyof typeof colorStyles[typeof baseColor] => {
    if (count >= 5000) return 900
    if (count >= 2000) return 800
    if (count >= 1000) return 700
    if (count >= 500) return 600
    if (count >= 200) return 500
    if (count >= 100) return 400
    if (count >= 50) return 300
    if (count >= 20) return 200
    return 100
  }

  // 根据变体和数量设置样式
  const getVariantClass = () => {
    const intensity = getColorIntensity(count)

    if (variant === 'outline') {
      return `bg-transparent border border-${baseColor}-300 text-${baseColor}-700 hover:bg-${baseColor}-50`
    }
    if (variant === 'solid') {
      return colorStyles[baseColor][600]
    }

    // 默认变体：根据数量动态设置颜色深度
    return colorStyles[baseColor][intensity]
  }

  // 计数样式
  const getCountClass = () => {
    if (variant === 'outline') return countStyles[baseColor].light
    if (variant === 'solid') return countStyles[baseColor].dark

    // 默认变体根据数量设置计数样式
    if (count >= 1000) return countStyles[baseColor].dark
    if (count >= 100) return countStyles[baseColor].medium
    return countStyles[baseColor].light
  }

  return (
    <Link
      href={`/tags/${tag.slug}`}
      className={cn(
        'inline-flex items-center rounded-full transition-colors',
        sizeClasses[size],
        getVariantClass(),
        className
      )}
    >
      <span className="mr-1">{tag.name}</span>
      {count > 0 && (
        <span className={cn('text-xs rounded-full px-2 py-0.5 ml-1', getCountClass())}>
          {formatNumber(count)}
        </span>
      )}
    </Link>
  )
}

export default TagBubble
