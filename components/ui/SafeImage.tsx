import React from 'react'
import NextImage, { ImageProps } from 'next/image'

// 创建一个安全的Image组件，避免fetchPriority警告
export function SafeImage(props: Omit<ImageProps, 'fetchPriority' | 'priority'> & { highPriority?: boolean }) {
  const { highPriority, ...otherProps } = props

  // 使用原生img标签而不是Next.js的Image组件
  if (props.fill) {
    // 对于fill模式，我们需要使用div包装
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <img
          src={props.src as string}
          alt={props.alt}
          style={{
            objectFit: props.className?.includes('object-contain') ? 'contain' : 'cover',
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0
          }}
          className={props.className}
        />
      </div>
    )
  }

  // 对于非fill模式，直接使用img标签
  return (
    <img
      src={props.src as string}
      alt={props.alt}
      width={props.width}
      height={props.height}
      className={props.className}
      style={{
        objectFit: props.className?.includes('object-contain') ? 'contain' : 'cover',
      }}
    />
  )
}

export default SafeImage
