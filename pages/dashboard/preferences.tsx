import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { useUIStore } from '@/stores/uiStore'
import { FadeIn, ScaleIn } from '@/components/ui/PageTransition'

export default function PreferencesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const {
    themeMode,
    themeColor,
    layoutMode,
    fontSize,
    animationsEnabled,
    highContrast,
    reducedMotion,
    setThemeMode,
    setThemeColor,
    setLayoutMode,
    setFontSize,
    setAnimationsEnabled,
    setHighContrast,
    setReducedMotion,
    resetToDefaults,
  } = useUIStore()

  if (status === 'loading') {
    return (
      <DashboardLayout title="用户偏好设置">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  const handleSave = async () => {
    setIsSaving(true)
    // 模拟保存延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    // 这里可以添加保存到服务器的逻辑
  }

  const themeColors = [
    { value: 'blue', label: '蓝色', color: 'bg-blue-500' },
    { value: 'purple', label: '紫色', color: 'bg-purple-500' },
    { value: 'green', label: '绿色', color: 'bg-green-500' },
    { value: 'orange', label: '橙色', color: 'bg-orange-500' },
  ]

  return (
    <DashboardLayout title="用户偏好设置">
      <div className="max-w-4xl mx-auto">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">用户偏好设置</h1>
            <p className="mt-2 text-gray-600 dark:text-dark-muted">
              自定义您的界面外观和交互体验
            </p>
          </div>
        </FadeIn>

        <div className="space-y-8">
          {/* 主题设置 */}
          <ScaleIn delay={100}>
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-4">主题设置</h2>
              
              <div className="space-y-6">
                {/* 主题模式 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-3">
                    主题模式
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: '浅色', icon: '☀️' },
                      { value: 'dark', label: '深色', icon: '🌙' },
                      { value: 'system', label: '跟随系统', icon: '💻' },
                    ].map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => setThemeMode(mode.value as any)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          themeMode === mode.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border/80'
                        }`}
                      >
                        <div className="text-2xl mb-2">{mode.icon}</div>
                        <div className="text-sm font-medium">{mode.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 主题颜色 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-3">
                    主题颜色
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {themeColors.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setThemeColor(color.value as any)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          themeColor === color.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border/80'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${color.color} mx-auto mb-2`}></div>
                        <div className="text-sm font-medium">{color.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScaleIn>

          {/* 布局设置 */}
          <ScaleIn delay={200}>
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-4">布局设置</h2>
              
              <div className="space-y-6">
                {/* 布局模式 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-3">
                    布局密度
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'compact', label: '紧凑', desc: '更多内容' },
                      { value: 'comfortable', label: '舒适', desc: '平衡体验' },
                      { value: 'spacious', label: '宽松', desc: '更多空间' },
                    ].map((layout) => (
                      <button
                        key={layout.value}
                        onClick={() => setLayoutMode(layout.value as any)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          layoutMode === layout.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border/80'
                        }`}
                      >
                        <div className="font-medium text-sm">{layout.label}</div>
                        <div className="text-xs text-gray-500 dark:text-dark-muted mt-1">{layout.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 字体大小 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-3">
                    字体大小
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'small', label: '小', size: 'text-sm' },
                      { value: 'medium', label: '中', size: 'text-base' },
                      { value: 'large', label: '大', size: 'text-lg' },
                    ].map((font) => (
                      <button
                        key={font.value}
                        onClick={() => setFontSize(font.value as any)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          fontSize === font.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-dark-border/80'
                        }`}
                      >
                        <div className={`font-medium ${font.size}`}>{font.label}</div>
                        <div className={`text-gray-500 dark:text-dark-muted mt-1 ${font.size}`}>示例文字</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ScaleIn>

          {/* 无障碍设置 */}
          <ScaleIn delay={300}>
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-dark-border p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text mb-4">无障碍设置</h2>
              
              <div className="space-y-4">
                {[
                  {
                    key: 'animationsEnabled',
                    label: '启用动画效果',
                    description: '页面切换和交互动画',
                    value: animationsEnabled,
                    onChange: setAnimationsEnabled,
                  },
                  {
                    key: 'highContrast',
                    label: '高对比度模式',
                    description: '提高文字和背景的对比度',
                    value: highContrast,
                    onChange: setHighContrast,
                  },
                  {
                    key: 'reducedMotion',
                    label: '减少动画',
                    description: '减少或禁用动画效果',
                    value: reducedMotion,
                    onChange: setReducedMotion,
                  },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-dark-text">{setting.label}</div>
                      <div className="text-sm text-gray-500 dark:text-dark-muted">{setting.description}</div>
                    </div>
                    <button
                      onClick={() => setting.onChange(!setting.value)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        setting.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-border'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          setting.value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </ScaleIn>

          {/* 操作按钮 */}
          <ScaleIn delay={400}>
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={resetToDefaults}
                className="text-gray-600 dark:text-dark-muted"
              >
                恢复默认设置
              </Button>
              
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                >
                  取消
                </Button>
                <Button
                  onClick={handleSave}
                  isLoading={isSaving}
                >
                  保存设置
                </Button>
              </div>
            </div>
          </ScaleIn>
        </div>
      </div>
    </DashboardLayout>
  )
}
