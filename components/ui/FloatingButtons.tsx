import { useState, useEffect, useRef } from 'react'

export default function FloatingButtons() {
  const [showButtons, setShowButtons] = useState(false)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastScrollTopRef = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop

      // 检测是否在滚动
      if (scrollTop !== lastScrollTopRef.current) {
        setShowButtons(true)
        lastScrollTopRef.current = scrollTop



        // 清除之前的隐藏定时器
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current)
        }

        // 设置新的隐藏定时器：停止滚动3秒后隐藏
        hideTimeoutRef.current = setTimeout(() => {
          setShowButtons(false)
        }, 3000)
      }
    }

    // 监听滚动事件
    window.addEventListener('scroll', handleScroll, { passive: true })

    // 清理函数
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    })
  }

  // 鼠标悬停时保持显示
  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }
    setShowButtons(true)
  }

  const handleMouseLeave = () => {
    // 鼠标离开后2秒隐藏
    hideTimeoutRef.current = setTimeout(() => {
      setShowButtons(false)
    }, 2000)
  }



  return (
    <div
      data-floating-buttons
      className={`fixed right-3 top-1/2 transform -translate-y-1/2 sm:right-4 md:right-6 z-[9999] flex flex-col space-y-2 transition-all duration-300 ${
        showButtons
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 translate-x-full pointer-events-none'
      }`}
      style={{
        position: 'fixed',
        zIndex: 9999,
        pointerEvents: showButtons ? 'auto' : 'none'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 一键到顶按钮 */}
      <button
        onClick={scrollToTop}
        className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group backdrop-blur-sm border border-blue-400/20"
        title="回到顶部"
        aria-label="回到顶部"
      >
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 transform group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
        </svg>
      </button>

      {/* 一键到底按钮 */}
      <button
        onClick={scrollToBottom}
        className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group backdrop-blur-sm border border-gray-500/20"
        title="到达底部"
        aria-label="到达底部"
      >
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 transform group-hover:scale-110 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
    </div>
  )
}
