import React, { useState, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscan?: number
  onScroll?: (scrollTop: number) => void
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  const totalHeight = items.length * itemHeight

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    )

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, end + overscan),
    }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  const visibleItems = useMemo(() => {
    const result = []
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      result.push({
        index: i,
        item: items[i],
      })
    }
    return result
  }, [items, visibleRange])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)
  }

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// 网格虚拟滚动组件
interface VirtualGridProps<T> {
  items: T[]
  itemWidth: number
  itemHeight: number
  containerWidth: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  gap?: number
  overscan?: number
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  className,
  gap = 0,
  overscan = 5,
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  const columnsCount = Math.floor(containerWidth / (itemWidth + gap))
  const rowsCount = Math.ceil(items.length / columnsCount)
  const totalHeight = rowsCount * (itemHeight + gap) - gap

  const visibleRange = useMemo(() => {
    const startRow = Math.floor(scrollTop / (itemHeight + gap))
    const endRow = Math.min(
      startRow + Math.ceil(containerHeight / (itemHeight + gap)),
      rowsCount - 1
    )

    return {
      start: Math.max(0, startRow - overscan),
      end: Math.min(rowsCount - 1, endRow + overscan),
    }
  }, [scrollTop, itemHeight, gap, containerHeight, rowsCount, overscan])

  const visibleItems = useMemo(() => {
    const result = []
    for (let row = visibleRange.start; row <= visibleRange.end; row++) {
      for (let col = 0; col < columnsCount; col++) {
        const index = row * columnsCount + col
        if (index < items.length) {
          result.push({
            index,
            item: items[index],
            row,
            col,
          })
        }
      }
    }
    return result
  }, [items, visibleRange, columnsCount])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, row, col }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: row * (itemHeight + gap),
              left: col * (itemWidth + gap),
              width: itemWidth,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

// 无限滚动组件
interface InfiniteScrollProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  loadMore: () => Promise<void>
  hasMore: boolean
  isLoading: boolean
  className?: string
  threshold?: number
  loader?: React.ReactNode
}

export function InfiniteScroll<T>({
  items,
  renderItem,
  loadMore,
  hasMore,
  isLoading,
  className,
  threshold = 200,
  loader,
}: InfiniteScrollProps<T>) {
  const scrollElementRef = useRef<HTMLDivElement>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    const scrollElement = scrollElementRef.current
    if (!scrollElement) return

    const handleScroll = async () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement
      
      if (
        scrollHeight - scrollTop - clientHeight < threshold &&
        hasMore &&
        !isLoading &&
        !isLoadingMore
      ) {
        setIsLoadingMore(true)
        try {
          await loadMore()
        } finally {
          setIsLoadingMore(false)
        }
      }
    }

    scrollElement.addEventListener('scroll', handleScroll)
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [loadMore, hasMore, isLoading, isLoadingMore, threshold])

  const defaultLoader = (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      <span className="ml-2 text-gray-600 dark:text-dark-muted">加载更多...</span>
    </div>
  )

  return (
    <div ref={scrollElementRef} className={cn('overflow-auto', className)}>
      {items.map((item, index) => renderItem(item, index))}
      {(isLoading || isLoadingMore) && (loader || defaultLoader)}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-dark-muted">
          没有更多内容了
        </div>
      )}
    </div>
  )
}
