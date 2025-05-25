import React, { useState, useRef, useEffect } from 'react'
import { MediaResponse } from '@/types/api'
import { Tab } from '@headlessui/react'
import {
  RectangleStackIcon as CropIcon,
  ArrowPathIcon as RefreshIcon,
  PhotoIcon as PhotographIcon,
  ScissorsIcon,
  AdjustmentsHorizontalIcon as AdjustmentsIcon
} from '@heroicons/react/24/outline'
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import ImageProcessor from './ImageProcessor'
import VideoProcessor from './VideoProcessor'
import AudioProcessor from './AudioProcessor'

interface MediaProcessorProps {
  media: MediaResponse
  onClose: () => void
  onProcessed: (result: any) => void
}

const MediaProcessor: React.FC<MediaProcessorProps> = ({
  media,
  onClose,
  onProcessed
}) => {
  const [activeTab, setActiveTab] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createVersion, setCreateVersion] = useState(true)
  const [versionNote, setVersionNote] = useState('')

  // 图片处理状态
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 50,
    height: 50,
    x: 25,
    y: 25
  })
  const [rotation, setRotation] = useState(0)
  const [imageWidth, setImageWidth] = useState<number | undefined>(media.width || undefined)
  const [imageHeight, setImageHeight] = useState<number | undefined>(media.height || undefined)
  const [imageQuality, setImageQuality] = useState(80)
  const [imageFormat, setImageFormat] = useState('webp')
  const [grayscale, setGrayscale] = useState(false)
  const [blur, setBlur] = useState(0)
  const [sharpen, setSharpen] = useState(false)

  // 视频处理状态
  const [videoWidth, setVideoWidth] = useState<number | undefined>(media.width || undefined)
  const [videoHeight, setVideoHeight] = useState<number | undefined>(media.height || undefined)
  const [videoQuality, setVideoQuality] = useState(23)
  const [videoFormat, setVideoFormat] = useState('mp4')
  const [videoCodec, setVideoCodec] = useState('h264')
  const [startTime, setStartTime] = useState(0)
  const [duration, setDuration] = useState<number | undefined>(media.duration || undefined)

  // 音频处理状态
  const [audioQuality, setAudioQuality] = useState(4)
  const [audioFormat, setAudioFormat] = useState('mp3')
  const [audioBitrate, setAudioBitrate] = useState('128k')
  const [audioStartTime, setAudioStartTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState<number | undefined>(media.duration || undefined)
  const [normalize, setNormalize] = useState(false)

  const imageRef = useRef<HTMLImageElement>(null)

  // 处理图片
  const handleImageProcess = async (operation: string) => {
    if (!media.id) return

    setIsProcessing(true)
    setError(null)

    try {
      const params: any = {
        mediaId: media.id,
        operation,
        createVersion,
        versionNote: versionNote || `图片${getOperationName(operation)}`,
      }

      // 根据操作类型设置参数
      switch (operation) {
        case 'resize':
          params.width = imageWidth
          params.height = imageHeight
          params.quality = imageQuality
          params.format = imageFormat
          break
        case 'crop':
          if (imageRef.current && crop.width && crop.height) {
            const scaleX = imageRef.current.naturalWidth / imageRef.current.width
            const scaleY = imageRef.current.naturalHeight / imageRef.current.height

            params.left = Math.round(crop.x * scaleX)
            params.top = Math.round(crop.y * scaleY)
            params.width = Math.round(crop.width * scaleX)
            params.height = Math.round(crop.height * scaleY)
            params.quality = imageQuality
            params.format = imageFormat
          }
          break
        case 'rotate':
          params.rotate = rotation
          params.quality = imageQuality
          params.format = imageFormat
          break
        case 'convert':
          params.format = imageFormat
          params.quality = imageQuality
          break
        case 'optimize':
          params.quality = imageQuality
          params.format = imageFormat
          break
      }

      // 添加特效参数
      if (grayscale) params.grayscale = true
      if (blur > 0) params.blur = blur
      if (sharpen) params.sharpen = true

      // 发送处理请求
      const response = await fetch('/api/v1/media/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || '处理失败')
      }

      onProcessed(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败')
    } finally {
      setIsProcessing(false)
    }
  }

  // 处理视频
  const handleVideoProcess = async (operation: string) => {
    if (!media.id) return

    setIsProcessing(true)
    setError(null)

    try {
      const params: any = {
        mediaId: media.id,
        operation,
        createVersion,
        versionNote: versionNote || `视频${getOperationName(operation)}`,
      }

      // 根据操作类型设置参数
      switch (operation) {
        case 'resize':
          params.width = videoWidth
          params.height = videoHeight
          params.quality = videoQuality
          params.format = videoFormat
          params.codec = videoCodec
          break
        case 'convert':
          params.format = videoFormat
          params.codec = videoCodec
          params.quality = videoQuality
          break
        case 'trim':
          params.startTime = startTime
          params.duration = duration
          params.quality = videoQuality
          params.format = videoFormat
          params.codec = videoCodec
          break
        case 'optimize':
          params.quality = videoQuality
          params.format = videoFormat
          params.codec = videoCodec
          break
      }

      // 发送处理请求
      const response = await fetch('/api/v1/media/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || '处理失败')
      }

      onProcessed(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败')
    } finally {
      setIsProcessing(false)
    }
  }

  // 处理音频
  const handleAudioProcess = async (operation: string) => {
    if (!media.id) return

    setIsProcessing(true)
    setError(null)

    try {
      const params: any = {
        mediaId: media.id,
        operation,
        createVersion,
        versionNote: versionNote || `音频${getOperationName(operation)}`,
      }

      // 根据操作类型设置参数
      switch (operation) {
        case 'convert':
          params.format = audioFormat
          params.quality = audioQuality
          params.bitrate = audioBitrate
          break
        case 'trim':
          params.startTime = audioStartTime
          params.duration = audioDuration
          params.quality = audioQuality
          params.format = audioFormat
          break
        case 'normalize':
          params.normalize = true
          params.quality = audioQuality
          params.format = audioFormat
          break
      }

      // 发送处理请求
      const response = await fetch('/api/v1/media/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || '处理失败')
      }

      onProcessed(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败')
    } finally {
      setIsProcessing(false)
    }
  }

  // 获取操作名称
  const getOperationName = (operation: string): string => {
    const operationNames: Record<string, string> = {
      resize: '调整大小',
      crop: '裁剪',
      rotate: '旋转',
      convert: '格式转换',
      optimize: '优化',
      trim: '裁剪',
      normalize: '音量标准化'
    }

    return operationNames[operation] || operation
  }

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden max-w-4xl w-full">
      <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center">
        <h2 className="text-xl font-semibold">媒体处理</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-white hover:text-gray-200"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 text-red-700 border-b border-red-200">
          {error}
        </div>
      )}

      <div className="p-6">
        {/* 根据媒体类型显示不同的处理选项 */}
        {media.type === 'IMAGE' && (
          <ImageProcessor
            media={media}
            crop={crop}
            setCrop={setCrop}
            rotation={rotation}
            setRotation={setRotation}
            imageWidth={imageWidth}
            setImageWidth={setImageWidth}
            imageHeight={imageHeight}
            setImageHeight={setImageHeight}
            imageQuality={imageQuality}
            setImageQuality={setImageQuality}
            imageFormat={imageFormat}
            setImageFormat={setImageFormat}
            grayscale={grayscale}
            setGrayscale={setGrayscale}
            blur={blur}
            setBlur={setBlur}
            sharpen={sharpen}
            setSharpen={setSharpen}
            imageRef={imageRef}
            handleProcess={handleImageProcess}
            isProcessing={isProcessing}
          />
        )}

        {media.type === 'VIDEO' && (
          <VideoProcessor
            media={media}
            videoWidth={videoWidth}
            setVideoWidth={setVideoWidth}
            videoHeight={videoHeight}
            setVideoHeight={setVideoHeight}
            videoQuality={videoQuality}
            setVideoQuality={setVideoQuality}
            videoFormat={videoFormat}
            setVideoFormat={setVideoFormat}
            videoCodec={videoCodec}
            setVideoCodec={setVideoCodec}
            startTime={startTime}
            setStartTime={setStartTime}
            duration={duration}
            setDuration={setDuration}
            handleProcess={handleVideoProcess}
            isProcessing={isProcessing}
          />
        )}

        {media.type === 'AUDIO' && (
          <AudioProcessor
            media={media}
            audioQuality={audioQuality}
            setAudioQuality={setAudioQuality}
            audioFormat={audioFormat}
            setAudioFormat={setAudioFormat}
            audioBitrate={audioBitrate}
            setAudioBitrate={setAudioBitrate}
            startTime={audioStartTime}
            setStartTime={setAudioStartTime}
            duration={audioDuration}
            setDuration={setAudioDuration}
            normalize={normalize}
            setNormalize={setNormalize}
            handleProcess={handleAudioProcess}
            isProcessing={isProcessing}
          />
        )}

        {/* 版本控制选项 */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="create-version"
              checked={createVersion}
              onChange={(e) => setCreateVersion(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="create-version" className="ml-2 block text-sm text-gray-900">
              创建新版本
            </label>
          </div>

          {createVersion && (
            <div className="mt-2">
              <label htmlFor="version-note" className="block text-sm font-medium text-gray-700">
                版本说明
              </label>
              <input
                type="text"
                id="version-note"
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                placeholder="输入版本说明（可选）"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MediaProcessor
