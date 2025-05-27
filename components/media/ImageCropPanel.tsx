import React from 'react'
import ReactCrop, { Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

import { MediaResponse } from '@/types/api'

interface ImageCropPanelProps {
  media: MediaResponse
  crop: Crop
  setCrop: (crop: Crop) => void
  aspectRatio: number | undefined
  handleAspectRatioChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  getAspectRatioValue: () => string
  imageFormat: string
  setImageFormat: (format: string) => void
  imageQuality: number
  setImageQuality: (quality: number) => void
  imageRef: React.RefObject<HTMLImageElement>
  handleProcess: (operation: string) => Promise<void>
  isProcessing: boolean
}

export default function ImageCropPanel({
  media,
  crop,
  setCrop,
  aspectRatio,
  handleAspectRatioChange,
  getAspectRatioValue,
  imageFormat,
  setImageFormat,
  imageQuality,
  setImageQuality,
  imageRef,
  handleProcess,
  isProcessing
}: ImageCropPanelProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="flex-1">
        <div className="mb-4 bg-gray-100 p-2 rounded-md">
          <ReactCrop
            crop={crop}
            onChange={c => setCrop(c)}
            aspect={aspectRatio}
          >
            <img
              ref={imageRef}
              src={media.url}
              alt={media.title || '图片'}
              className="max-w-full max-h-[400px] mx-auto"
            />
          </ReactCrop>
        </div>
      </div>
      <div className="w-full md:w-64">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            宽高比
          </label>
          <select
            value={getAspectRatioValue()}
            onChange={handleAspectRatioChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="free">自由裁剪</option>
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
          onClick={() => handleProcess('crop')}
          disabled={isProcessing}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '处理中...' : '应用裁剪'}
        </button>
      </div>
    </div>
  )
}

export type { ImageCropPanelProps }
