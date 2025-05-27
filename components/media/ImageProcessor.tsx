import React from 'react'
import { Tab } from '@headlessui/react'
import { Crop } from 'react-image-crop'

import { MediaResponse } from '@/types/api'
import { useImageProcessor } from '@/hooks/useImageProcessor'

import ImageProcessorTabs from './ImageProcessorTabs'
import ImageCropPanel from './ImageCropPanel'
import ImageRotatePanel from './ImageRotatePanel'
import ImageResizePanel from './ImageResizePanel'
import ImageEffectsPanel from './ImageEffectsPanel'
import ImageFormatPanel from './ImageFormatPanel'

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
  const { aspectRatio, handleAspectRatioChange, getAspectRatioValue } = useImageProcessor({
    media,
    imageWidth,
    setImageHeight
  })

  return (
    <div>
      <Tab.Group>
        <ImageProcessorTabs />
        <Tab.Panels>
          {/* 裁剪面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
            <ImageCropPanel
              media={media}
              crop={crop}
              setCrop={setCrop}
              aspectRatio={aspectRatio}
              handleAspectRatioChange={handleAspectRatioChange}
              getAspectRatioValue={getAspectRatioValue}
              imageFormat={imageFormat}
              setImageFormat={setImageFormat}
              imageQuality={imageQuality}
              setImageQuality={setImageQuality}
              imageRef={imageRef}
              handleProcess={handleProcess}
              isProcessing={isProcessing}
            />
          </Tab.Panel>

          {/* 旋转面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
            <ImageRotatePanel
              media={media}
              rotation={rotation}
              setRotation={setRotation}
              imageFormat={imageFormat}
              setImageFormat={setImageFormat}
              imageQuality={imageQuality}
              setImageQuality={setImageQuality}
              handleProcess={handleProcess}
              isProcessing={isProcessing}
            />
          </Tab.Panel>

          {/* 调整大小面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
            <ImageResizePanel
              media={media}
              imageWidth={imageWidth}
              setImageWidth={setImageWidth}
              imageHeight={imageHeight}
              setImageHeight={setImageHeight}
              handleAspectRatioChange={handleAspectRatioChange}
              imageFormat={imageFormat}
              setImageFormat={setImageFormat}
              imageQuality={imageQuality}
              setImageQuality={setImageQuality}
              handleProcess={handleProcess}
              isProcessing={isProcessing}
            />
          </Tab.Panel>

          {/* 特效面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
            <ImageEffectsPanel
              media={media}
              grayscale={grayscale}
              setGrayscale={setGrayscale}
              blur={blur}
              setBlur={setBlur}
              sharpen={sharpen}
              setSharpen={setSharpen}
              imageFormat={imageFormat}
              setImageFormat={setImageFormat}
              imageQuality={imageQuality}
              setImageQuality={setImageQuality}
              handleProcess={handleProcess}
              isProcessing={isProcessing}
            />
          </Tab.Panel>

          {/* 格式转换面板 */}
          <Tab.Panel className="rounded-xl bg-white p-3">
            <ImageFormatPanel
              media={media}
              imageFormat={imageFormat}
              setImageFormat={setImageFormat}
              imageQuality={imageQuality}
              setImageQuality={setImageQuality}
              handleProcess={handleProcess}
              isProcessing={isProcessing}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}

export default ImageProcessor
