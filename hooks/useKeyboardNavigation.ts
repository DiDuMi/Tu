import { useEffect, useRef, useState } from 'react'

interface KeyboardNavigationOptions {
  enabled?: boolean
  loop?: boolean
  onSelect?: (index: number) => void
  onEscape?: () => void
}

export function useKeyboardNavigation(
  itemCount: number,
  options: KeyboardNavigationOptions = {}
) {
  const { enabled = true, loop = true, onSelect, onEscape } = options
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => {
            if (prev < itemCount - 1) {
              return prev + 1
            }
            return loop ? 0 : prev
          })
          break

        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => {
            if (prev > 0) {
              return prev - 1
            }
            return loop ? itemCount - 1 : prev
          })
          break

        case 'Enter':
        case ' ':
          event.preventDefault()
          if (selectedIndex >= 0 && onSelect) {
            onSelect(selectedIndex)
          }
          break

        case 'Escape':
          event.preventDefault()
          setSelectedIndex(-1)
          if (onEscape) {
            onEscape()
          }
          break

        case 'Home':
          event.preventDefault()
          setSelectedIndex(0)
          break

        case 'End':
          event.preventDefault()
          setSelectedIndex(itemCount - 1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, itemCount, loop, onSelect, onEscape, selectedIndex])

  // 自动滚动到选中项
  useEffect(() => {
    if (selectedIndex >= 0 && containerRef.current) {
      const selectedElement = containerRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        })
      }
    }
  }, [selectedIndex])

  const reset = () => setSelectedIndex(-1)

  return {
    selectedIndex,
    setSelectedIndex,
    containerRef,
    reset,
  }
}

// 焦点管理Hook
export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null)

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  const restoreFocus = () => {
    if (focusedElement) {
      focusedElement.focus()
      setFocusedElement(null)
    }
  }

  const saveFocus = () => {
    setFocusedElement(document.activeElement as HTMLElement)
  }

  return {
    trapFocus,
    restoreFocus,
    saveFocus,
  }
}


