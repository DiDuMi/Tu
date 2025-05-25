import React, { useState } from 'react'
import { MediaResponse } from '@/types/api'
import { Tab } from '@headlessui/react'
import {
  Video,
  Scissors,
  ArrowLeftRight,
  Settings
} from 'lucide-react'
import { formatDuration } from '@/lib/format'

interface VideoProcessorProps {
  media: MediaResponse
  videoWidth: number | undefined
  setVideoWidth: (width: number | undefined) => void
  videoHeight: number | undefined
  setVideoHeight: (height: number | undefined) => void
  videoQuality: number
  setVideoQuality: (quality: number) => void
  videoFormat: string
  setVideoFormat: (format: string) => void
  videoCodec: string
  setVideoCodec: (codec: string) => void
  startTime: number
  setStartTime: (time: number) => void
  duration: number | undefined
  setDuration: (duration: number | undefined) => void
  handleProcess: (operation: string) => Promise<void>
  isProcessing: boolean
}

const VideoProcessor: React.FC<VideoProcessorProps> = ({
  media,
  videoWidth,
  setVideoWidth,
  videoHeight,
  setVideoHeight,
  videoQuality,
  setVideoQuality,
  videoFormat,
  setVideoFormat,
  videoCodec,
  setVideoCodec,
  startTime,
  setStartTime,
  duration,
  setDuration,
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
  React.useEffect(() => {
    if (aspectRatio && videoWidth && !isNaN(videoWidth)) {
      setVideoHeight(Math.round(videoWidth / aspectRatio))
    }
  }, [aspectRatio, videoWidth, setVideoHeight])

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

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
            <Video className="h-4 w-4 mr-1" />
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
            <Scissors className="h-4 w-4 mr-1" />
            裁剪时间
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
            <ArrowLeftRight className="h-4 w-4 mr-1" />
            格式转换
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
            <Settings className="h-4 w-4 mr-1" />
            优化
          </Tab>
        </Tab.List>
        <Tab.Panels>
          {/* 调整大小面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="mb-4 bg-gray-100 p-2 rounded-md flex items-center justify-center">
                  <video
                    src={media.url}
                    controls
                    className="max-w-full max-h-[400px]"
                  >
                    您的浏览器不支持视频播放
                  </video>
                </div>
              </div>
              <div className="w-full md:w-64">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    宽度 (像素)
                  </label>
                  <input
                    type="number"
                    value={videoWidth || ''}
                    onChange={(e) => setVideoWidth(e.target.value ? parseInt(e.target.value) : undefined)}
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
                    value={videoHeight || ''}
                    onChange={(e) => setVideoHeight(e.target.value ? parseInt(e.target.value) : undefined)}
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
                    <option value="9:16">竖屏 (9:16)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    质量 (CRF: {videoQuality}, 值越小质量越高)
                  </label>
                  <input
                    type="range"
                    min="18"
                    max="28"
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>高质量</span>
                    <span>低质量</span>
                  </div>
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

          {/* 裁剪时间面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="mb-4 bg-gray-100 p-2 rounded-md flex items-center justify-center">
                  <video
                    src={media.url}
                    controls
                    className="max-w-full max-h-[400px]"
                  >
                    您的浏览器不支持视频播放
                  </video>
                </div>
                <div className="text-center text-sm text-gray-500">
                  总时长: {media.duration ? formatTime(media.duration) : '未知'}
                </div>
              </div>
              <div className="w-full md:w-64">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间 ({formatTime(startTime)})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={media.duration ? media.duration - 1 : 0}
                    value={startTime}
                    onChange={(e) => setStartTime(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    持续时间 ({duration ? formatTime(duration) : '到结尾'})
                  </label>
                  <input
                    type="range"
                    min="1"
                    max={media.duration ? media.duration - startTime : 60}
                    value={duration || (media.duration ? media.duration - startTime : 60)}
                    onChange={(e) => setDuration(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    输出格式
                  </label>
                  <select
                    value={videoFormat}
                    onChange={(e) => setVideoFormat(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="mp4">MP4 (推荐)</option>
                    <option value="webm">WebM</option>
                    <option value="gif">GIF</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    质量 (CRF: {videoQuality}, 值越小质量越高)
                  </label>
                  <input
                    type="range"
                    min="18"
                    max="28"
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleProcess('trim')}
                  disabled={isProcessing}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? '处理中...' : '应用裁剪'}
                </button>
              </div>
            </div>
          </Tab.Panel>

          {/* 格式转换面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="mb-4 bg-gray-100 p-2 rounded-md flex items-center justify-center">
                  <video
                    src={media.url}
                    controls
                    className="max-w-full max-h-[400px]"
                  >
                    您的浏览器不支持视频播放
                  </video>
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
                    value={videoFormat}
                    onChange={(e) => setVideoFormat(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="mp4">MP4 (广泛兼容)</option>
                    <option value="webm">WebM (开源格式)</option>
                    <option value="gif">GIF (动画)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    编码器
                  </label>
                  <select
                    value={videoCodec}
                    onChange={(e) => setVideoCodec(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    disabled={videoFormat === 'gif'}
                  >
                    <option value="h264">H.264 (广泛兼容)</option>
                    <option value="h265">H.265 (高效率)</option>
                    <option value="vp9">VP9 (开源)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    质量 (CRF: {videoQuality}, 值越小质量越高)
                  </label>
                  <input
                    type="range"
                    min="18"
                    max="28"
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(parseInt(e.target.value))}
                    className="w-full"
                    disabled={videoFormat === 'gif'}
                  />
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                  <p className="font-medium mb-1">格式说明:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>MP4</strong>: 最广泛支持的格式，适合大多数场景</li>
                    <li><strong>WebM</strong>: 开源格式，体积小，适合网页</li>
                    <li><strong>GIF</strong>: 动画格式，无声音，体积大</li>
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

          {/* 优化面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="mb-4 bg-gray-100 p-2 rounded-md flex items-center justify-center">
                  <video
                    src={media.url}
                    controls
                    className="max-w-full max-h-[400px]"
                  >
                    您的浏览器不支持视频播放
                  </video>
                </div>
              </div>
              <div className="w-full md:w-64">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    质量 (CRF: {videoQuality}, 值越小质量越高)
                  </label>
                  <input
                    type="range"
                    min="18"
                    max="28"
                    value={videoQuality}
                    onChange={(e) => setVideoQuality(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>高质量</span>
                    <span>低质量</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    输出格式
                  </label>
                  <select
                    value={videoFormat}
                    onChange={(e) => setVideoFormat(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="mp4">MP4 (推荐)</option>
                    <option value="webm">WebM</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    编码器
                  </label>
                  <select
                    value={videoCodec}
                    onChange={(e) => setVideoCodec(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="h264">H.264 (广泛兼容)</option>
                    <option value="h265">H.265 (高效率)</option>
                    <option value="vp9">VP9 (开源)</option>
                  </select>
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                  <p>优化将重新编码视频以减小文件大小，同时尽量保持视频质量。这对于需要节省存储空间或提高加载速度的场景非常有用。</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleProcess('optimize')}
                  disabled={isProcessing}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? '处理中...' : '优化视频'}
                </button>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}

export default VideoProcessor
