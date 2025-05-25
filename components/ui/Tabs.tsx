import React, { useState, createContext, useContext } from 'react'

// 创建Tabs上下文
interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

// Tabs组件属性
interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

// Tabs组件
export function Tabs({ value, onValueChange, children, className = '' }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  )
}

// TabsList组件属性
interface TabsListProps {
  children: React.ReactNode
  className?: string
}

// TabsList组件
export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div className={`flex space-x-1 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  )
}

// TabsTrigger组件属性
interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

// TabsTrigger组件
export function TabsTrigger({ value, children, className = '', disabled = false }: TabsTriggerProps) {
  const context = useContext(TabsContext)
  
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component')
  }
  
  const { value: selectedValue, onValueChange } = context
  const isSelected = selectedValue === value
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
        isSelected
          ? 'border-primary-500 text-primary-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={() => onValueChange(value)}
    >
      {children}
    </button>
  )
}

// TabsContent组件属性
interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
}

// TabsContent组件
export function TabsContent({ value, children, className = '' }: TabsContentProps) {
  const context = useContext(TabsContext)
  
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component')
  }
  
  const { value: selectedValue } = context
  
  if (selectedValue !== value) {
    return null
  }
  
  return <div className={`mt-2 ${className}`}>{children}</div>
}
