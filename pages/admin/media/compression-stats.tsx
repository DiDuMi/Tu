import React from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import AdminLayout from '@/components/layout/AdminLayout'
import CompressionStats from '@/components/media/CompressionStats'

interface CompressionStatsPageProps {
  user: {
    id: number
    name: string
    email: string
    role: string
  }
}

const CompressionStatsPage: React.FC<CompressionStatsPageProps> = ({ user }) => {
  return (
    <AdminLayout user={user}>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">视频压缩统计</h1>
              <p className="mt-1 text-sm text-gray-500">
                监控视频压缩性能，分析优化效果，获取系统优化建议
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                智能压缩已启用
              </span>
            </div>
          </div>
        </div>

        {/* 功能说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-400 text-xl">ℹ️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">智能压缩系统说明</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>系统会自动分析视频内容特征（复杂度、运动水平、内容类型）</li>
                  <li>根据分析结果智能选择最优的压缩参数（CRF、预设、分辨率）</li>
                  <li>动态调整处理超时时间，提高成功率</li>
                  <li>实时监控压缩效果，提供系统优化建议</li>
                  <li>支持性能历史追踪和趋势分析</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 压缩统计组件 */}
        <CompressionStats isAdmin={true} />

        {/* 技术参数说明 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🔧 技术参数说明</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">CRF (Constant Rate Factor)</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• 18-21: 高质量，文件较大</div>
                <div>• 22-25: 平衡质量，推荐范围</div>
                <div>• 26-28: 高压缩，质量略降</div>
                <div>• 数值越低质量越高，文件越大</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">编码预设 (Preset)</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• veryfast: 速度优先，压缩效率一般</div>
                <div>• fast: 速度较快，压缩效率良好</div>
                <div>• medium: 平衡速度和压缩效率</div>
                <div>• slow: 压缩效率优先，速度较慢</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">内容复杂度分析</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• low: 简单内容，可高压缩</div>
                <div>• medium: 一般内容，标准压缩</div>
                <div>• high: 复杂内容，保持质量</div>
                <div>• 基于分辨率和比特率自动判断</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">运动水平检测</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• static: 静态内容，极高压缩</div>
                <div>• low: 少量运动，高压缩</div>
                <div>• medium: 中等运动，标准压缩</div>
                <div>• high: 大量运动，保持质量</div>
              </div>
            </div>
          </div>
        </div>

        {/* 优化建议 */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">💡 系统优化建议</h3>
          
          <div className="space-y-4">
            <div className="border-l-4 border-green-400 pl-4">
              <h4 className="font-medium text-green-800">性能优化</h4>
              <p className="text-sm text-gray-600 mt-1">
                如果平均处理时间超过2分钟，建议升级服务器CPU或启用硬件加速
              </p>
            </div>
            
            <div className="border-l-4 border-blue-400 pl-4">
              <h4 className="font-medium text-blue-800">压缩效果优化</h4>
              <p className="text-sm text-gray-600 mt-1">
                如果平均压缩率低于30%，建议调整CRF参数或启用两阶段编码
              </p>
            </div>
            
            <div className="border-l-4 border-yellow-400 pl-4">
              <h4 className="font-medium text-yellow-800">成功率优化</h4>
              <p className="text-sm text-gray-600 mt-1">
                如果成功率低于90%，建议增加处理超时时间或检查FFmpeg配置
              </p>
            </div>
            
            <div className="border-l-4 border-purple-400 pl-4">
              <h4 className="font-medium text-purple-800">编码器升级</h4>
              <p className="text-sm text-gray-600 mt-1">
                考虑启用H.265编码器以获得更好的压缩效果（需要更多处理时间）
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session?.user) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    }
  }

  // 检查管理员权限
  if (session.user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    }
  }

  return {
    props: {
      user: {
        id: session.user.id,
        name: session.user.name || '',
        email: session.user.email || '',
        role: session.user.role || 'USER',
      },
    },
  }
}

export default CompressionStatsPage
