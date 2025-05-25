import React, { createContext, useContext, useEffect } from 'react'
import { useUIStore } from '@/stores/uiStore'

interface AccessibilityContextType {
  highContrast: boolean
  reducedMotion: boolean
  fontSize: 'small' | 'medium' | 'large'
  animationsEnabled: boolean
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

interface AccessibilityProviderProps {
  children: React.ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const { highContrast, reducedMotion, fontSize, animationsEnabled } = useUIStore()

  useEffect(() => {
    const root = document.documentElement

    // 高对比度模式
    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // 减少动画
    if (reducedMotion || !animationsEnabled) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // 字体大小
    root.classList.remove('font-small', 'font-medium', 'font-large')
    root.classList.add(`font-${fontSize}`)

    // 检测用户系统偏好
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      root.classList.add('prefers-reduced-motion')
    }

    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
    if (prefersHighContrast) {
      root.classList.add('prefers-high-contrast')
    }

  }, [highContrast, reducedMotion, fontSize, animationsEnabled])

  const value = {
    highContrast,
    reducedMotion,
    fontSize,
    animationsEnabled,
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      <AccessibilityStyles />
    </AccessibilityContext.Provider>
  )
}

function AccessibilityStyles() {
  return (
    <style jsx global>{`
      /* 高对比度模式样式 */
      .high-contrast {
        --tw-bg-opacity: 1;
        --tw-text-opacity: 1;
      }

      .high-contrast * {
        border-color: #000 !important;
      }

      .high-contrast .bg-white {
        background-color: #ffffff !important;
        color: #000000 !important;
      }

      .high-contrast .bg-gray-50,
      .high-contrast .bg-gray-100 {
        background-color: #f8f9fa !important;
        color: #000000 !important;
      }

      .high-contrast .text-gray-500,
      .high-contrast .text-gray-600,
      .high-contrast .text-gray-700 {
        color: #000000 !important;
      }

      .high-contrast .bg-primary-500,
      .high-contrast .bg-primary-600 {
        background-color: #0066cc !important;
        color: #ffffff !important;
      }

      .high-contrast .text-primary-600 {
        color: #0066cc !important;
      }

      .high-contrast button:focus,
      .high-contrast a:focus,
      .high-contrast input:focus,
      .high-contrast textarea:focus,
      .high-contrast select:focus {
        outline: 3px solid #0066cc !important;
        outline-offset: 2px !important;
      }

      /* 减少动画 */
      .reduce-motion *,
      .reduce-motion *::before,
      .reduce-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }

      .prefers-reduced-motion *,
      .prefers-reduced-motion *::before,
      .prefers-reduced-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }

      /* 字体大小 */
      .font-small {
        font-size: 14px;
      }

      .font-small .text-sm {
        font-size: 12px;
      }

      .font-small .text-base {
        font-size: 14px;
      }

      .font-small .text-lg {
        font-size: 16px;
      }

      .font-small .text-xl {
        font-size: 18px;
      }

      .font-medium {
        font-size: 16px;
      }

      .font-large {
        font-size: 18px;
      }

      .font-large .text-sm {
        font-size: 16px;
      }

      .font-large .text-base {
        font-size: 18px;
      }

      .font-large .text-lg {
        font-size: 20px;
      }

      .font-large .text-xl {
        font-size: 22px;
      }

      /* 焦点指示器增强 */
      .high-contrast *:focus {
        outline: 3px solid #0066cc !important;
        outline-offset: 2px !important;
      }

      /* 跳过链接样式 */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .sr-only:focus,
      .focus\\:not-sr-only:focus {
        position: static;
        width: auto;
        height: auto;
        padding: 0.5rem 1rem;
        margin: 0;
        overflow: visible;
        clip: auto;
        white-space: normal;
      }

      /* 改善链接可见性 */
      .high-contrast a {
        text-decoration: underline !important;
      }

      .high-contrast a:hover {
        text-decoration: none !important;
        background-color: #0066cc !important;
        color: #ffffff !important;
      }

      /* 改善按钮对比度 */
      .high-contrast button {
        border: 2px solid #000000 !important;
      }

      .high-contrast button:hover {
        background-color: #000000 !important;
        color: #ffffff !important;
      }

      /* 改善表单元素 */
      .high-contrast input,
      .high-contrast textarea,
      .high-contrast select {
        border: 2px solid #000000 !important;
        background-color: #ffffff !important;
        color: #000000 !important;
      }

      /* 改善卡片对比度 */
      .high-contrast .bg-white,
      .high-contrast .bg-gray-50 {
        border: 2px solid #000000 !important;
      }

      /* 系统偏好检测 */
      @media (prefers-contrast: high) {
        .prefers-high-contrast * {
          border-color: #000 !important;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .prefers-reduced-motion *,
        .prefers-reduced-motion *::before,
        .prefers-reduced-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* 改善键盘导航 */
      .keyboard-navigation *:focus {
        outline: 2px solid #0066cc;
        outline-offset: 2px;
      }

      /* 改善色彩对比度 */
      .high-contrast .text-blue-600 {
        color: #0066cc !important;
      }

      .high-contrast .text-green-600 {
        color: #006600 !important;
      }

      .high-contrast .text-red-600 {
        color: #cc0000 !important;
      }

      .high-contrast .text-yellow-600 {
        color: #cc6600 !important;
      }
    `}</style>
  )
}
