import { PlayIcon, LockClosedIcon } from '@heroicons/react/24/outline'

interface VideoPermissionNoticeProps {
  className?: string
  showUpgradeButton?: boolean
}

export default function VideoPermissionNotice({ 
  className = '', 
  showUpgradeButton = true 
}: VideoPermissionNoticeProps) {
  return (
    <div className={`video-permission-notice bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center my-4 ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        {/* 图标 */}
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
          <div className="relative">
            <PlayIcon className="w-8 h-8 text-gray-400" />
            <LockClosedIcon className="w-4 h-4 text-gray-500 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" />
          </div>
        </div>
        
        {/* 内容 */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            🎬 视频内容
          </h3>
          <p className="text-gray-600 mb-4">
            此处包含视频内容，您当前的用户组暂无播放权限
          </p>
          
          {showUpgradeButton && (
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm hover:bg-blue-100 transition-colors cursor-pointer">
              <svg 
                className="w-4 h-4 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              升级会员以观看视频内容
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
