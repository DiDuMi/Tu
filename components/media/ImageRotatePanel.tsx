import React from 'react'

import { MediaResponse } from '@/types/api'

interface ImageRotatePanelProps {
  media: MediaResponse
  rotation: number
  setRotation: (rotation: number) => void
  imageFormat: string
  setImageFormat: (format: string) => void
  imageQuality: number
  setImageQuality: (quality: number) => void
  handleProcess: (operation: string) => Promise<void>
  isProcessing: boolean
}

export default function ImageRotatePanel({
  media,
  rotation,
  setRotation,
  imageFormat,
  setImageFormat,
  imageQuality,
  setImageQuality,
  handleProcess,
  isProcessing
}: ImageRotatePanelProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <div className="mb-4 bg-gray-100 p-2 rounded-md flex items-center justify-center">
          <img
            src={media.url}
            alt={media.title || '图片'}
            className="max-w-full max-h-[400px]"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        </div>
      </div>
      <div className="w-full md:w-64">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            旋转角度 ({rotation}°)
          </label>
          <input
            type="range"
            min="-180"
            max="180"
            value={rotation}
            onChange={(e) => setRotation(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="flex space-x-2 mb-4">
          <button
            type="button"
            onClick={() => setRotation(rotation - 90)}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            -90°
          </button>
          <button
            type="button"
            onClick={() => setRotation(0)}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            重置
          </button>
          <button
            type="button"
            onClick={() => setRotation(rotation + 90)}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            +90°
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            输出格式
          </label>
          <select
            value={imageFormat}
            onChange={(e) => setImageFormat(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="webp">WebP (推荐)</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="avif">AVIF</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            质量 ({imageQuality}%)
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={imageQuality}
            onChange={(e) => setImageQuality(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <button
          type="button"
          onClick={() => handleProcess('rotate')}
          disabled={isProcessing}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '处理中...' : '应用旋转'}
        </button>
      </div>
    </div>
  )
}

export type { ImageRotatePanelProps }
