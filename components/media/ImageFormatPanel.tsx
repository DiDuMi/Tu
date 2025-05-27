import React from 'react'

import { MediaResponse } from '@/types/api'

interface ImageFormatPanelProps {
  media: MediaResponse
  imageFormat: string
  setImageFormat: (format: string) => void
  imageQuality: number
  setImageQuality: (quality: number) => void
  handleProcess: (operation: string) => Promise<void>
  isProcessing: boolean
}

export default function ImageFormatPanel({
  media,
  imageFormat,
  setImageFormat,
  imageQuality,
  setImageQuality,
  handleProcess,
  isProcessing
}: ImageFormatPanelProps) {
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
        <div className="text-center text-sm text-gray-500">
          当前格式: {media.mimeType?.split('/')[1]?.toUpperCase() || '未知'}
        </div>
      </div>
      <div className="w-full md:w-64">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            目标格式
          </label>
          <select
            value={imageFormat}
            onChange={(e) => setImageFormat(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="webp">WebP (推荐，体积小)</option>
            <option value="jpeg">JPEG (广泛兼容)</option>
            <option value="png">PNG (无损，支持透明)</option>
            <option value="avif">AVIF (新一代格式，体积更小)</option>
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

        <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
          <p className="font-medium mb-1">格式说明:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>WebP</strong>: 谷歌开发的现代格式，体积小，支持透明和动画</li>
            <li><strong>JPEG</strong>: 常用格式，适合照片，不支持透明</li>
            <li><strong>PNG</strong>: 无损格式，支持透明，体积较大</li>
            <li><strong>AVIF</strong>: 最新格式，体积最小，但兼容性较差</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={() => handleProcess('convert')}
          disabled={isProcessing}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '处理中...' : '转换格式'}
        </button>
      </div>
    </div>
  )
}

export type { ImageFormatPanelProps }
