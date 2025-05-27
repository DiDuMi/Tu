import { useState, useEffect } from 'react'

import { MediaResponse } from '@/types/api'

interface UseImageProcessorProps {
  media: MediaResponse
  imageWidth: number | undefined
  setImageHeight: (height: number | undefined) => void
}

export function useImageProcessor({ media, imageWidth, setImageHeight }: UseImageProcessorProps) {
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(undefined)

  // 设置宽高比
  const handleAspectRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === 'free') {
      setAspectRatio(undefined)
    } else if (value === 'original' && media.width && media.height) {
      setAspectRatio(media.width / media.height)
    } else {
      const [width, height] = value.split(':').map(Number)
      setAspectRatio(width / height)
    }
  }

  // 保持宽高比例
  useEffect(() => {
    if (aspectRatio && imageWidth && !isNaN(imageWidth)) {
      setImageHeight(Math.round(imageWidth / aspectRatio))
    }
  }, [aspectRatio, imageWidth, setImageHeight])

  // 获取当前宽高比选择值
  const getAspectRatioValue = () => {
    if (!aspectRatio) return 'free'
    if (aspectRatio === (media.width || 0) / (media.height || 1)) return 'original'
    return 'custom'
  }

  return {
    aspectRatio,
    handleAspectRatioChange,
    getAspectRatioValue
  }
}

export type { UseImageProcessorProps }
