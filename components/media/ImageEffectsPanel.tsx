import React from 'react'

import { MediaResponse } from '@/types/api'

interface ImageEffectsPanelProps {
  media: MediaResponse
  grayscale: boolean
  setGrayscale: (grayscale: boolean) => void
  blur: number
  setBlur: (blur: number) => void
  sharpen: boolean
  setSharpen: (sharpen: boolean) => void
  imageFormat: string
  setImageFormat: (format: string) => void
  imageQuality: number
  setImageQuality: (quality: number) => void
  handleProcess: (operation: string) => Promise<void>
  isProcessing: boolean
}

export default function ImageEffectsPanel({
  media,
  grayscale,
  setGrayscale,
  blur,
  setBlur,
  sharpen,
  setSharpen,
  imageFormat,
  setImageFormat,
  imageQuality,
  setImageQuality,
  handleProcess,
  isProcessing
}: ImageEffectsPanelProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <div className="mb-4 bg-gray-100 p-2 rounded-md flex items-center justify-center">
          <img
            src={media.url}
            alt={media.title || '图片'}
            className="max-w-full max-h-[400px]"
            style={{
              filter: `${grayscale ? 'grayscale(1) ' : ''}${blur > 0 ? `blur(${blur}px) ` : ''}${sharpen ? 'contrast(1.5) ' : ''}`
            }}
          />
        </div>
      </div>
      <div className="w-full md:w-64">
        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="grayscale"
              checked={grayscale}
              onChange={(e) => setGrayscale(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="grayscale" className="ml-2 block text-sm text-gray-900">
              灰度
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            模糊 ({blur})
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={blur}
            onChange={(e) => setBlur(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="sharpen"
              checked={sharpen}
              onChange={(e) => setSharpen(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="sharpen" className="ml-2 block text-sm text-gray-900">
              锐化
            </label>
          </div>
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
          onClick={() => handleProcess('optimize')}
          disabled={isProcessing}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '处理中...' : '应用特效'}
        </button>
      </div>
    </div>
  )
}

export type { ImageEffectsPanelProps }
