import React from 'react'
import { Tab } from '@headlessui/react'
import {
  RectangleStackIcon as CropIcon,
  ArrowPathIcon as RefreshIcon,
  PhotoIcon as PhotographIcon,
  ScissorsIcon,
  AdjustmentsHorizontalIcon as AdjustmentsIcon
} from '@heroicons/react/24/outline'

export default function ImageProcessorTabs() {
  return (
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
  )
}
