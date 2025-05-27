import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface CompressionStatsProps {
  userId?: number
  isAdmin?: boolean
}

interface CompressionStats {
  totalProcessed: number
  successRate: number
  averageProcessingTime: number
  averageCompressionRatio: number
  averageFileSizeReduction: number
  extremes: {
    slowest: any
    fastest: any
    bestCompression: any
    worstCompression: any
  }
}

interface CompressionHistory {
  taskId: string
  filename: string
  originalSize: number
  compressedSize: number | null
  processingTime: number
  compressionRatio: number | null
  crf: number
  preset: string
  resolution: string
  codec: string
  success: boolean
  error?: string
  timestamp: string
}

const CompressionStats: React.FC<CompressionStatsProps> = ({ userId, isAdmin = false }) => {
  const [stats, setStats] = useState<CompressionStats | null>(null)
  const [history, setHistory] = useState<CompressionHistory[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v1/media/compression-stats?type=${isAdmin ? 'admin' : 'user'}`)
      
      if (!response.ok) {
        throw new Error('获取统计数据失败')
      }

      const data = await response.json()
      if (data.success) {
        setStats(data.data.stats)
        setHistory(data.data.history)
        setSuggestions(data.data.suggestions || [])
        setRecommendations(data.data.recommendations || [])
      } else {
        throw new Error(data.error?.message || '获取统计数据失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [isAdmin])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 text-center">
          <p className="mb-4">❌ {error}</p>
          <Button onClick={fetchStats} variant="outline" size="sm">
            重试
          </Button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">暂无统计数据</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 总体统计 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          📊 压缩统计概览
          {isAdmin && <span className="ml-2 text-sm text-blue-600">(全局)</span>}
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalProcessed}</div>
            <div className="text-sm text-gray-500">处理总数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">成功率</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.averageProcessingTime.toFixed(1)}s</div>
            <div className="text-sm text-gray-500">平均处理时间</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.averageCompressionRatio.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">平均压缩率</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.averageFileSizeReduction.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">平均文件减小</div>
          </div>
        </div>
      </div>

      {/* 建议和推荐 */}
      {(recommendations.length > 0 || suggestions.length > 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">💡 优化建议</h3>
          
          {recommendations.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-green-700 mb-2">用户建议：</h4>
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-sm text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {suggestions.length > 0 && isAdmin && (
            <div>
              <h4 className="font-medium text-blue-700 mb-2">系统优化建议：</h4>
              <ul className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">⚙️</span>
                    <div className="text-sm text-gray-700">
                      <div className="font-medium">{suggestion.type}: {suggestion.current} → {suggestion.suggested}</div>
                      <div className="text-gray-500">{suggestion.reason}</div>
                      <div className="text-green-600">{suggestion.expectedImprovement}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 极值展示 */}
      {stats.extremes && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">🏆 处理记录</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.extremes.fastest && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-green-600 mb-2">⚡ 最快处理</h4>
                <div className="text-sm space-y-1">
                  <div>文件: {stats.extremes.fastest.filename}</div>
                  <div>时间: {stats.extremes.fastest.processingTime}秒</div>
                  <div>大小: {stats.extremes.fastest.originalSize}MB</div>
                  <div>预设: {stats.extremes.fastest.preset}</div>
                </div>
              </div>
            )}

            {stats.extremes.bestCompression && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-blue-600 mb-2">🎯 最佳压缩</h4>
                <div className="text-sm space-y-1">
                  <div>文件: {stats.extremes.bestCompression.filename}</div>
                  <div>压缩率: {stats.extremes.bestCompression.compressionRatio}%</div>
                  <div>原始: {stats.extremes.bestCompression.originalSize}MB</div>
                  <div>压缩后: {stats.extremes.bestCompression.compressedSize}MB</div>
                  <div>CRF: {stats.extremes.bestCompression.crf}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 最近处理历史 */}
      {history.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📝 最近处理记录</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">文件名</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">原始大小</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">压缩后</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">压缩率</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">处理时间</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.slice(0, 10).map((record) => (
                  <tr key={record.taskId} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm text-gray-900 truncate max-w-32" title={record.filename}>
                      {record.filename}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {record.originalSize.toFixed(1)}MB
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {record.compressedSize ? `${record.compressedSize.toFixed(1)}MB` : '-'}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {record.compressionRatio ? `${record.compressionRatio.toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {record.processingTime.toFixed(1)}s
                    </td>
                    <td className="px-3 py-2 text-sm">
                      {record.success ? (
                        <span className="text-green-600">✓ 成功</span>
                      ) : (
                        <span className="text-red-600" title={record.error}>✗ 失败</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 刷新按钮 */}
      <div className="text-center">
        <Button onClick={fetchStats} variant="outline" size="sm">
          🔄 刷新数据
        </Button>
      </div>
    </div>
  )
}

export default CompressionStats
