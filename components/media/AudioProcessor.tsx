import React, { useState } from 'react'
import { MediaResponse } from '@/types/api'
import { Tab } from '@headlessui/react'
import {
  MusicalNoteIcon as MusicNoteIcon,
  ScissorsIcon,
  ArrowsRightLeftIcon as SwitchHorizontalIcon,
  SpeakerWaveIcon as VolumeUpIcon
} from '@heroicons/react/24/outline'

interface AudioProcessorProps {
  media: MediaResponse
  audioQuality: number
  setAudioQuality: (quality: number) => void
  audioFormat: string
  setAudioFormat: (format: string) => void
  audioBitrate: string
  setAudioBitrate: (bitrate: string) => void
  startTime: number
  setStartTime: (time: number) => void
  duration: number | undefined
  setDuration: (duration: number | undefined) => void
  normalize: boolean
  setNormalize: (normalize: boolean) => void
  handleProcess: (operation: string) => Promise<void>
  isProcessing: boolean
}

const AudioProcessor: React.FC<AudioProcessorProps> = ({
  media,
  audioQuality,
  setAudioQuality,
  audioFormat,
  setAudioFormat,
  audioBitrate,
  setAudioBitrate,
  startTime,
  setStartTime,
  duration,
  setDuration,
  normalize,
  setNormalize,
  handleProcess,
  isProcessing
}) => {
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
            <SwitchHorizontalIcon className="h-4 w-4 mr-1" />
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
            <ScissorsIcon className="h-4 w-4 mr-1" />
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
            <VolumeUpIcon className="h-4 w-4 mr-1" />
            音量标准化
          </Tab>
        </Tab.List>
        <Tab.Panels>
          {/* 格式转换面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="mb-4 bg-gray-100 p-2 rounded-md flex items-center justify-center">
                  <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm flex flex-col items-center">
                    <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 flex items-center justify-center overflow-hidden">
                      {media.thumbnailUrl ? (
                        <img
                          src={media.thumbnailUrl}
                          alt="音频缩略图"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MusicNoteIcon className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                    <p className="text-lg font-medium mb-4">{media.title || '音频文件'}</p>
                    <audio
                      src={media.url}
                      controls
                      className="w-full"
                    >
                      您的浏览器不支持音频播放
                    </audio>
                  </div>
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
                    value={audioFormat}
                    onChange={(e) => setAudioFormat(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="mp3">MP3 (广泛兼容)</option>
                    <option value="aac">AAC (高质量)</option>
                    <option value="ogg">OGG (开源格式)</option>
                    <option value="wav">WAV (无损)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    质量 ({audioQuality}, 值越小质量越高)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="9"
                    value={audioQuality}
                    onChange={(e) => setAudioQuality(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>高质量</span>
                    <span>低质量</span>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    比特率
                  </label>
                  <select
                    value={audioBitrate}
                    onChange={(e) => setAudioBitrate(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="64k">64 kbps (低质量)</option>
                    <option value="128k">128 kbps (标准质量)</option>
                    <option value="192k">192 kbps (高质量)</option>
                    <option value="256k">256 kbps (很高质量)</option>
                    <option value="320k">320 kbps (最高质量)</option>
                  </select>
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                  <p className="font-medium mb-1">格式说明:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>MP3</strong>: 最广泛支持的格式，适合大多数场景</li>
                    <li><strong>AAC</strong>: 更高效的压缩，适合苹果设备</li>
                    <li><strong>OGG</strong>: 开源格式，适合网页</li>
                    <li><strong>WAV</strong>: 无损格式，体积大</li>
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

          {/* 裁剪时间面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="mb-4 bg-gray-100 p-2 rounded-md flex items-center justify-center">
                  <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm flex flex-col items-center">
                    <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 flex items-center justify-center overflow-hidden">
                      {media.thumbnailUrl ? (
                        <img
                          src={media.thumbnailUrl}
                          alt="音频缩略图"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MusicNoteIcon className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                    <p className="text-lg font-medium mb-4">{media.title || '音频文件'}</p>
                    <audio
                      src={media.url}
                      controls
                      className="w-full"
                    >
                      您的浏览器不支持音频播放
                    </audio>
                  </div>
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
                    value={audioFormat}
                    onChange={(e) => setAudioFormat(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="mp3">MP3 (推荐)</option>
                    <option value="aac">AAC</option>
                    <option value="ogg">OGG</option>
                    <option value="wav">WAV</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    质量 ({audioQuality}, 值越小质量越高)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="9"
                    value={audioQuality}
                    onChange={(e) => setAudioQuality(parseInt(e.target.value))}
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

          {/* 音量标准化面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="mb-4 bg-gray-100 p-2 rounded-md flex items-center justify-center">
                  <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm flex flex-col items-center">
                    <div className="w-32 h-32 bg-gray-200 rounded-full mb-4 flex items-center justify-center overflow-hidden">
                      {media.thumbnailUrl ? (
                        <img
                          src={media.thumbnailUrl}
                          alt="音频缩略图"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MusicNoteIcon className="w-16 h-16 text-gray-400" />
                      )}
                    </div>
                    <p className="text-lg font-medium mb-4">{media.title || '音频文件'}</p>
                    <audio
                      src={media.url}
                      controls
                      className="w-full"
                    >
                      您的浏览器不支持音频播放
                    </audio>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-64">
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="normalize"
                      checked={normalize}
                      onChange={(e) => setNormalize(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="normalize" className="ml-2 block text-sm text-gray-900">
                      启用音量标准化
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    输出格式
                  </label>
                  <select
                    value={audioFormat}
                    onChange={(e) => setAudioFormat(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="mp3">MP3 (推荐)</option>
                    <option value="aac">AAC</option>
                    <option value="ogg">OGG</option>
                    <option value="wav">WAV</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    质量 ({audioQuality}, 值越小质量越高)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="9"
                    value={audioQuality}
                    onChange={(e) => setAudioQuality(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                  <p>音量标准化可以使音频的音量保持在一个一致的水平，避免音量忽大忽小的问题。这对于播放列表或需要一致音量的场景非常有用。</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleProcess('normalize')}
                  disabled={isProcessing}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? '处理中...' : '标准化音量'}
                </button>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}

export default AudioProcessor
