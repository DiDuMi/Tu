import { useState } from 'react'
import { useUIStore, ThemeMode, ThemeColor } from '@/stores/uiStore'
import { themeColorOptions, themeModeOptions } from './ThemeProvider'

export default function ThemeSwitcher() {
  const { themeMode, themeColor, setThemeMode, setThemeColor, toggleThemeMode, getEffectiveThemeMode } = useUIStore()
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  // 获取当前有效的主题模式（考虑系统主题）
  const effectiveMode = getEffectiveThemeMode()

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center justify-center w-8 h-8 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        aria-label="切换主题"
      >
        {themeMode === 'system' ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-600 dark:text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        ) : effectiveMode === 'light' ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-card rounded-lg shadow-lg overflow-hidden z-50 border dark:border-dark-border">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text mb-3">主题设置</h3>

            {/* 亮色/暗色模式切换 */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 dark:text-dark-muted mb-2">显示模式</p>
              <div className="flex items-center justify-between bg-gray-100 dark:bg-dark-border rounded-md p-1">
                {themeModeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setThemeMode(option.value)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      themeMode === option.value
                        ? 'bg-white dark:bg-dark-bg shadow-sm'
                        : 'text-gray-500 dark:text-dark-muted'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 主题颜色选择 */}
            <div>
              <p className="text-xs text-gray-500 dark:text-dark-muted mb-2">主题颜色</p>
              <div className="grid grid-cols-2 gap-2">
                {themeColorOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setThemeColor(option.value)}
                    className={`flex items-center p-2 rounded-md transition-colors ${
                      themeColor === option.value
                        ? 'bg-gray-100 dark:bg-dark-border'
                        : 'hover:bg-gray-50 dark:hover:bg-dark-border'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-${option.value === 'blue' ? 'primary' : option.value}-500 mr-2`} />
                    <div className="text-left">
                      <p className="text-xs font-medium dark:text-dark-text">{option.label}</p>
                      <p className="text-xs text-gray-500 dark:text-dark-muted">{option.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeDropdown}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
