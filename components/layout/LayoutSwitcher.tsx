import { useState } from 'react'
import { useUIStore, HomeLayoutMode } from '@/stores/uiStore'

export default function LayoutSwitcher() {
  const { homeLayoutMode, setHomeLayoutMode } = useUIStore()
  const [isOpen, setIsOpen] = useState(false)

  const layoutOptions: { value: HomeLayoutMode; label: string; description: string; icon: JSX.Element }[] = [
    {
      value: 'default',
      label: '默认布局',
      description: '传统的顶部导航布局',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    },
    {
      value: 'sidebar',
      label: '侧边栏布局',
      description: '左侧垂直导航栏布局',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6v12" />
        </svg>
      )
    }
  ]

  const currentLayout = layoutOptions.find(option => option.value === homeLayoutMode) || layoutOptions[0]

  const toggleDropdown = () => setIsOpen(!isOpen)
  const closeDropdown = () => setIsOpen(false)

  const handleLayoutChange = (mode: HomeLayoutMode) => {
    setHomeLayoutMode(mode)
    closeDropdown()
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-dark-text hover:text-gray-900 dark:hover:text-dark-text/90 hover:bg-gray-100 dark:hover:bg-dark-border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="切换布局模式"
      >
        <div className="flex-shrink-0">
          {currentLayout.icon}
        </div>
        <span className="hidden sm:block">{currentLayout.label}</span>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-dark-card rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50 border dark:border-dark-border">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text mb-3">首页布局</h3>
            
            <div className="space-y-2">
              {layoutOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleLayoutChange(option.value)}
                  className={`w-full flex items-start p-3 rounded-md transition-colors ${
                    homeLayoutMode === option.value
                      ? 'bg-primary-50 dark:bg-dark-primary/10 border border-primary-200 dark:border-dark-primary/30'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-border/50 border border-transparent'
                  }`}
                >
                  <div className="flex-shrink-0 mr-3 mt-0.5">
                    <div className={`${
                      homeLayoutMode === option.value
                        ? 'text-primary-600 dark:text-dark-primary'
                        : 'text-gray-400 dark:text-dark-muted'
                    }`}>
                      {option.icon}
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${
                      homeLayoutMode === option.value
                        ? 'text-primary-900 dark:text-dark-primary'
                        : 'text-gray-900 dark:text-dark-text'
                    }`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-dark-muted mt-1">
                      {option.description}
                    </p>
                  </div>
                  {homeLayoutMode === option.value && (
                    <div className="flex-shrink-0 ml-2">
                      <svg className="w-4 h-4 text-primary-600 dark:text-dark-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-dark-border">
              <p className="text-xs text-gray-500 dark:text-dark-muted">
                💡 提示：布局设置会自动保存，下次访问时会记住您的选择
              </p>
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
