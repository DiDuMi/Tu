import React from 'react'

import { MediaResponse } from '@/types/api'

interface ImageResizePanelProps {
  media: MediaResponse
  imageWidth: number | undefined
  setImageWidth: (width: number | undefined) => void
  imageHeight: number | undefined
  setImageHeight: (height: number | undefined) => void
  handleAspectRatioChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  imageFormat: string
  setImageFormat: (format: string) => void
  imageQuality: number
  setImageQuality: (quality: number) => void
  handleProcess: (operation: string) => Promise<void>
  isProcessing: boolean
}

export default function ImageResizePanel({
  media,
  imageWidth,
  setImageWidth,
  imageHeight,
  setImageHeight,
  handleAspectRatioChange,
  imageFormat,
  setImageFormat,
  imageQuality,
  setImageQuality,
  handleProcess,
  isProcessing
}: ImageResizePanelProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <div className="mb-4 bg-gray-100 p-2 rounded-md flex items-center justify-center">
          <img
            src={media.url}
            alt={media.title || '图片'}
            className="max-w-full max-h-[400px]"
          />
        </div>
      </div>
      <div className="w-full md:w-64">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            宽度 (像素)
          </label>
          <input
            type="number"
            value={imageWidth || ''}
            onChange={(e) => setImageWidth(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="宽度"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            高度 (像素)
          </label>
          <input
            type="number"
            value={imageHeight || ''}
            onChange={(e) => setImageHeight(e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="高度"
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            宽高比
          </label>
          <select
            onChange={handleAspectRatioChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="free">自由比例</option>
            <option value="original">原始比例</option>
            <option value="1:1">正方形 (1:1)</option>
            <option value="4:3">标准 (4:3)</option>
            <option value="16:9">宽屏 (16:9)</option>
            <option value="3:4">竖屏 (3:4)</option>
            <option value="9:16">移动端 (9:16)</option>
          </select>
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
          onClick={() => handleProcess('resize')}
          disabled={isProcessing}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '处理中...' : '应用调整'}
        </button>
      </div>
    </div>
  )
}

export type { ImageResizePanelProps }
