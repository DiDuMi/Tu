/**
 * 主题状态管理
 * 使用Zustand管理主题相关状态
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 主题类型
export type Theme = 'light' | 'dark' | 'system'

// 主题状态接口
interface ThemeState {
  // 当前主题
  theme: Theme
  // 是否启用系统主题
  systemTheme: boolean
  // 设置主题
  setTheme: (theme: Theme) => void
  // 切换主题
  toggleTheme: () => void
  // 获取实际主题（考虑系统主题）
  getActualTheme: () => 'light' | 'dark'
}

// 创建主题状态
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // 默认主题为系统主题
      theme: 'system',
      // 默认启用系统主题
      systemTheme: true,
      
      // 设置主题
      setTheme: (theme) => {
        set({ theme })
        
        // 如果选择了系统主题，则启用系统主题
        if (theme === 'system') {
          set({ systemTheme: true })
        } else {
          set({ systemTheme: false })
        }
        
        // 应用主题到文档
        if (typeof document !== 'undefined') {
          const root = document.documentElement
          
          // 移除所有主题类
          root.classList.remove('light-theme', 'dark-theme')
          
          // 添加新主题类
          const actualTheme = theme === 'system' 
            ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
            : theme
            
          root.classList.add(`${actualTheme}-theme`)
          
          // 设置颜色方案元标签
          document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', actualTheme)
        }
      },
      
      // 切换主题
      toggleTheme: () => {
        const currentTheme = get().theme
        
        if (currentTheme === 'light') {
          get().setTheme('dark')
        } else if (currentTheme === 'dark') {
          get().setTheme('system')
        } else {
          get().setTheme('light')
        }
      },
      
      // 获取实际主题
      getActualTheme: () => {
        const theme = get().theme
        
        if (theme === 'system' && typeof window !== 'undefined') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        
        return theme === 'dark' ? 'dark' : 'light'
      }
    }),
    {
      name: 'theme-store',
    }
  )
)
