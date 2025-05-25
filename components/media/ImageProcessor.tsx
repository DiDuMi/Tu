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

interface ImageProcessorProps {
  media: MediaResponse
  crop: Crop
  setCrop: (crop: Crop) => void
  rotation: number
  setRotation: (rotation: number) => void
  imageWidth: number | undefined
  setImageWidth: (width: number | undefined) => void
  imageHeight: number | undefined
  setImageHeight: (height: number | undefined) => void
  imageQuality: number
  setImageQuality: (quality: number) => void
  imageFormat: string
  setImageFormat: (format: string) => void
  grayscale: boolean
  setGrayscale: (grayscale: boolean) => void
  blur: number
  setBlur: (blur: number) => void
  sharpen: boolean
  setSharpen: (sharpen: boolean) => void
  imageRef: React.RefObject<HTMLImageElement>
  handleProcess: (operation: string) => Promise<void>
  isProcessing: boolean
}

const ImageProcessor: React.FC<ImageProcessorProps> = ({
  media,
  crop,
  setCrop,
  rotation,
  setRotation,
  imageWidth,
  setImageWidth,
  imageHeight,
  setImageHeight,
  imageQuality,
  setImageQuality,
  imageFormat,
  setImageFormat,
  grayscale,
  setGrayscale,
  blur,
  setBlur,
  sharpen,
  setSharpen,
  imageRef,
  handleProcess,
  isProcessing
}) => {
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

  return (
    <div>
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-50 p-1 mb-4">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
              ${selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-700'
              }`
            }
          >
            <CropIcon className="h-4 w-4 mr-1" />
            裁剪
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
              ${selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-700'
              }`
            }
          >
            <RefreshIcon className="h-4 w-4 mr-1" />
            旋转
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
              ${selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-700'
              }`
            }
          >
            <PhotographIcon className="h-4 w-4 mr-1" />
            调整大小
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
              ${selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-700'
              }`
            }
          >
            <AdjustmentsIcon className="h-4 w-4 mr-1" />
            特效
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center
              ${selected
                ? 'bg-white text-blue-700 shadow'
                : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-700'
              }`
            }
          >
            <ScissorsIcon className="h-4 w-4 mr-1" />
            格式转换
          </Tab>
        </Tab.List>
        <Tab.Panels>
          {/* 裁剪面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
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
                    value={aspectRatio ? (aspectRatio === (media.width || 0) / (media.height || 1) ? 'original' : 'custom') : 'free'}
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
          </Tab.Panel>

          {/* 旋转面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
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
          </Tab.Panel>

          {/* 调整大小面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
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
          </Tab.Panel>

          {/* 特效面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
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
          </Tab.Panel>

          {/* 格式转换面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
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
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}

export default ImageProcessor
