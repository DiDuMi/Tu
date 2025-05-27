import React, { useState } from 'react'
import Image from 'next/image'

import { cn } from '@/lib/utils'

import AdvancedVideo, { AdvancedVideoProps } from './AdvancedVideo'

/**
 * 视频播放器专用组件
 */
export function VideoPlayer({
  src,
  poster,
  aspectRatio = '16/9',
  autoPlay = false,
  muted = false,
  loop = false,
  className = '',
  containerClassName = '',
  ...props
}: Omit<AdvancedVideoProps, 'showControls'> & {
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
}) {
  return (
    <div className={cn('relative w-full overflow-hidden rounded-lg', containerClassName)}>
      <AdvancedVideo
        src={src}
        poster={poster}
        aspectRatio={aspectRatio}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        showControls={true}
        enableLazyLoading={true}
        autoOptimizeFormat={true}
        className={cn('w-full h-full', className)}
        {...props}
      />
    </div>
  )
}

/**
 * 视频预览组件（无控制条）
 */
export function VideoPreview({
  src,
  poster,
  aspectRatio = '16/9',
  autoPlay = true,
  muted = true,
  loop = true,
  className = '',
  containerClassName = '',
  onHover = false,
  ...props
}: Omit<AdvancedVideoProps, 'showControls'> & {
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  onHover?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const shouldPlay = onHover ? isHovered : autoPlay

  return (
    <div
      className={cn('relative w-full overflow-hidden rounded-lg', containerClassName)}
      onMouseEnter={() => onHover && setIsHovered(true)}
      onMouseLeave={() => onHover && setIsHovered(false)}
    >
      <AdvancedVideo
        src={src}
        poster={poster}
        aspectRatio={aspectRatio}
        autoPlay={shouldPlay}
        muted={muted}
        loop={loop}
        showControls={false}
        enableLazyLoading={true}
        autoOptimizeFormat={true}
        className={cn('w-full h-full object-cover', className)}
        {...props}
      />
    </div>
  )
}

/**
 * 视频缩略图组件
 */
export function VideoThumbnail({
  src,
  thumbnailTime = 1,
  width = 320,
  height = 180,
  alt = '视频缩略图',
  className = '',
  onClick,
  showPlayButton = true,
  ...props
}: {
  src: string
  thumbnailTime?: number
  width?: number
  height?: number
  alt?: string
  className?: string
  onClick?: () => void
  showPlayButton?: boolean
} & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height' | 'alt'>) {
  const thumbnailSrc = `${src}?thumbnail=1&time=${thumbnailTime}&w=${width}&h=${height}`

  return (
    <div
      className={cn('relative cursor-pointer group', className)}
      onClick={onClick}
    >
      <Image
        src={thumbnailSrc}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full object-cover rounded"
        {...props}
      />

      {showPlayButton && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all duration-200">
          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <svg className="w-6 h-6 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}
