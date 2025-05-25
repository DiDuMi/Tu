import { ReactNode, useEffect } from 'react'
import { useUIStore, ThemeMode, ThemeColor } from '@/stores/uiStore'

interface ThemeProviderProps {
  children: ReactNode
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const { themeMode, themeColor, getEffectiveThemeMode } = useUIStore()

  // 应用主题到 HTML 元素
  useEffect(() => {
    const root = window.document.documentElement

    // 获取有效的主题模式（考虑系统主题）
    const effectiveMode = getEffectiveThemeMode()

    // 应用暗色/亮色模式
    if (effectiveMode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // 应用主题颜色
    root.classList.remove('theme-blue', 'theme-purple', 'theme-green', 'theme-orange')
    root.classList.add(`theme-${themeColor}`)

    // 设置颜色方案元标签
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', effectiveMode)
  }, [themeMode, themeColor, getEffectiveThemeMode])

  // 监听系统主题变化
  useEffect(() => {
    if (themeMode !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      // 强制重新渲染以应用新的系统主题
      const root = window.document.documentElement
      const isDark = mediaQuery.matches

      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }

      // 更新颜色方案元标签
      document.querySelector('meta[name="color-scheme"]')?.setAttribute(
        'content',
        isDark ? 'dark' : 'light'
      )
    }

    // 添加监听器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleChange)
    }

    // 清理监听器
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        // 兼容旧版浏览器
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [themeMode])

  return <>{children}</>
}

// 主题选项数据
export const themeColorOptions: { value: ThemeColor; label: string; description: string }[] = [
  {
    value: 'blue',
    label: '蓝色主题',
    description: '默认主题，清新专业的蓝色调'
  },
  {
    value: 'purple',
    label: '紫色主题',
    description: '创意灵感的紫色调'
  },
  {
    value: 'green',
    label: '绿色主题',
    description: '自然和谐的绿色调'
  },
  {
    value: 'orange',
    label: '橙色主题',
    description: '活力四射的橙色调'
  },
]

export const themeModeOptions: { value: ThemeMode; label: string; description: string }[] = [
  {
    value: 'light',
    label: '亮色模式',
    description: '标准亮色界面，适合日间使用'
  },
  {
    value: 'dark',
    label: '暗色模式',
    description: '护眼暗色界面，适合夜间使用'
  },
  {
    value: 'system',
    label: '跟随系统',
    description: '自动跟随系统的亮暗模式设置'
  },
]
