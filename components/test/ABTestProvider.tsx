import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface ABTestConfig {
  testId: string
  variants: {
    id: string
    name: string
    weight: number // 权重，用于分配流量
  }[]
  enabled: boolean
  description?: string
}

interface ABTestResult {
  testId: string
  variantId: string
  timestamp: number
  userAgent: string
  sessionId: string
}

interface ABTestContextType {
  getVariant: (testId: string) => string | null
  recordEvent: (testId: string, eventType: string, data?: any) => void
  getTestResults: (testId: string) => ABTestResult[]
  isTestActive: (testId: string) => boolean
}

const ABTestContext = createContext<ABTestContextType | null>(null)

// 预定义的测试配置
const TEST_CONFIGS: Record<string, ABTestConfig> = {
  'image-component': {
    testId: 'image-component',
    variants: [
      { id: 'native-img', name: '原生 img 标签', weight: 50 },
      { id: 'nextjs-image', name: 'Next.js Image 组件', weight: 50 }
    ],
    enabled: true,
    description: '对比原生img标签和Next.js Image组件的性能'
  },
  'image-loading': {
    testId: 'image-loading',
    variants: [
      { id: 'eager', name: '立即加载', weight: 33 },
      { id: 'lazy', name: '懒加载', weight: 33 },
      { id: 'priority', name: '优先加载', weight: 34 }
    ],
    enabled: true,
    description: '测试不同图片加载策略的效果'
  }
}

interface ABTestProviderProps {
  children: ReactNode
  forceVariant?: Record<string, string> // 强制指定变体，用于测试
}

export function ABTestProvider({ children, forceVariant = {} }: ABTestProviderProps) {
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      let id = localStorage.getItem('ab-test-session-id')
      if (!id) {
        id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('ab-test-session-id', id)
      }
      return id
    }
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })

  const [testResults, setTestResults] = useState<Record<string, ABTestResult[]>>({})

  // 从localStorage加载测试结果
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ab-test-results')
      if (saved) {
        try {
          setTestResults(JSON.parse(saved))
        } catch (e) {
          console.warn('Failed to load AB test results:', e)
        }
      }
    }
  }, [])

  // 保存测试结果到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ab-test-results', JSON.stringify(testResults))
    }
  }, [testResults])

  // 获取用户的变体分配
  const getVariant = (testId: string): string | null => {
    // 如果强制指定了变体，直接返回
    if (forceVariant[testId]) {
      return forceVariant[testId]
    }

    const config = TEST_CONFIGS[testId]
    if (!config || !config.enabled) {
      return null
    }

    // 检查是否已经分配过变体
    const existingResult = testResults[testId]?.find(r => r.sessionId === sessionId)
    if (existingResult) {
      return existingResult.variantId
    }

    // 基于sessionId生成一致的随机数
    const hash = hashString(`${sessionId}_${testId}`)
    const random = (hash % 100) / 100

    // 根据权重分配变体
    let cumulativeWeight = 0
    const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0)
    
    for (const variant of config.variants) {
      cumulativeWeight += variant.weight
      if (random <= cumulativeWeight / totalWeight) {
        // 记录分配结果
        const result: ABTestResult = {
          testId,
          variantId: variant.id,
          timestamp: Date.now(),
          userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
          sessionId
        }
        
        setTestResults(prev => ({
          ...prev,
          [testId]: [...(prev[testId] || []), result]
        }))
        
        return variant.id
      }
    }

    // 默认返回第一个变体
    return config.variants[0]?.id || null
  }

  // 记录事件
  const recordEvent = (testId: string, eventType: string, data?: any) => {
    const variant = getVariant(testId)
    if (!variant) return

    const event = {
      testId,
      variantId: variant,
      eventType,
      data,
      timestamp: Date.now(),
      sessionId
    }

    // 这里可以发送到分析服务
    console.log('AB Test Event:', event)
    
    // 也可以存储到localStorage用于调试
    if (typeof window !== 'undefined') {
      const events = JSON.parse(localStorage.getItem('ab-test-events') || '[]')
      events.push(event)
      localStorage.setItem('ab-test-events', JSON.stringify(events.slice(-1000))) // 只保留最近1000个事件
    }
  }

  // 获取测试结果
  const getTestResults = (testId: string): ABTestResult[] => {
    return testResults[testId] || []
  }

  // 检查测试是否激活
  const isTestActive = (testId: string): boolean => {
    const config = TEST_CONFIGS[testId]
    return config?.enabled || false
  }

  const contextValue: ABTestContextType = {
    getVariant,
    recordEvent,
    getTestResults,
    isTestActive
  }

  return (
    <ABTestContext.Provider value={contextValue}>
      {children}
    </ABTestContext.Provider>
  )
}

// Hook for using AB tests
export function useABTest(testId: string) {
  const context = useContext(ABTestContext)
  if (!context) {
    throw new Error('useABTest must be used within ABTestProvider')
  }

  const variant = context.getVariant(testId)
  
  return {
    variant,
    recordEvent: (eventType: string, data?: any) => context.recordEvent(testId, eventType, data),
    isActive: context.isTestActive(testId)
  }
}

// Hook for AB test analytics
export function useABTestAnalytics() {
  const context = useContext(ABTestContext)
  if (!context) {
    throw new Error('useABTestAnalytics must be used within ABTestProvider')
  }

  const getAnalytics = (testId: string) => {
    const results = context.getTestResults(testId)
    const config = TEST_CONFIGS[testId]
    
    if (!config) return null

    const analytics = {
      testId,
      totalParticipants: results.length,
      variants: config.variants.map(variant => {
        const participantCount = results.filter(r => r.variantId === variant.id).length
        return {
          ...variant,
          participants: participantCount,
          percentage: results.length > 0 ? (participantCount / results.length) * 100 : 0
        }
      })
    }

    return analytics
  }

  const getAllAnalytics = () => {
    return Object.keys(TEST_CONFIGS).map(testId => getAnalytics(testId)).filter(Boolean)
  }

  return {
    getAnalytics,
    getAllAnalytics,
    getTestResults: context.getTestResults
  }
}

// 简单的字符串哈希函数
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return Math.abs(hash)
}

// AB测试管理组件
export function ABTestManager() {
  const { getAllAnalytics } = useABTestAnalytics()
  const [analytics, setAnalytics] = useState<any[]>([])

  useEffect(() => {
    setAnalytics(getAllAnalytics())
  }, [])

  const clearTestData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ab-test-results')
      localStorage.removeItem('ab-test-events')
      localStorage.removeItem('ab-test-session-id')
      window.location.reload()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">A/B 测试管理</h3>
        <button
          onClick={clearTestData}
          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          清除测试数据
        </button>
      </div>
      
      {analytics.map((test) => (
        <div key={test.testId} className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">{test.testId}</h4>
          <p className="text-sm text-gray-600 mb-3">
            总参与者: {test.totalParticipants}
          </p>
          
          <div className="space-y-2">
            {test.variants.map((variant: any) => (
              <div key={variant.id} className="flex items-center justify-between">
                <span className="text-sm">{variant.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {variant.participants} ({variant.percentage.toFixed(1)}%)
                  </span>
                  <div className="w-20 h-2 bg-gray-200 rounded">
                    <div 
                      className="h-full bg-blue-500 rounded"
                      style={{ width: `${variant.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default ABTestProvider
