import React from 'react'
import NextImage, { ImageProps } from 'next/image'

// 创建一个优化的Image组件，使用Next.js Image进行性能优化
export function SafeImage(props: Omit<ImageProps, 'fetchPriority'> & { highPriority?: boolean }) {
  const { highPriority, ...otherProps } = props

  // 确保移除所有可能导致警告的属性
  const cleanProps = { ...otherProps }
  delete (cleanProps as any).fetchPriority
  delete (cleanProps as any).fetchpriority // 也删除小写版本

  // 使用Next.js Image组件进行优化，明确设置所有属性
  return (
    <NextImage
      {...cleanProps}
      priority={highPriority || props.priority || false}
      style={{
        objectFit: props.className?.includes('object-contain') ? 'contain' : 'cover',
        ...props.style
      }}
      // 明确不设置 fetchPriority 相关属性
    />
  )
}

export default SafeImage
