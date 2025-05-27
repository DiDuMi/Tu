import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'

export default function TestCommentsPage() {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testGuestComment = async () => {
    setIsSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const guestId = `test_guest_${Date.now()}`
      
      const response = await fetch('/api/v1/pages/4482c84d-9a63-4477-850e-219e44bc0605/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Guest-Id': guestId,
        },
        body: JSON.stringify({
          content: content || '这是一条测试游客评论',
          isAnonymous: true,
          nickname: nickname || '测试游客',
          email: email || 'test@example.com',
          guestId: guestId,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult({ type: 'success', data })
      } else {
        setError(`API错误: ${data.error?.message || '未知错误'}`)
        setResult({ type: 'error', data })
      }
    } catch (err: any) {
      setError(`请求失败: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const testUserComment = async () => {
    setIsSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/v1/pages/4482c84d-9a63-4477-850e-219e44bc0605/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content || '这是一条测试注册用户评论',
          isAnonymous: false,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setResult({ type: 'success', data })
      } else {
        setError(`API错误: ${data.error?.message || '未知错误'}`)
        setResult({ type: 'error', data })
      }
    } catch (err: any) {
      setError(`请求失败: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">评论功能测试页面</h1>

        {/* 用户状态 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">当前用户状态</h2>
          {session ? (
            <div className="text-green-600">
              ✅ 已登录: {session.user.name} ({session.user.email})
            </div>
          ) : (
            <div className="text-orange-600">
              ⚠️ 未登录 (将以游客身份测试)
            </div>
          )}
        </div>

        {/* 测试表单 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">测试参数</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                评论内容
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="输入测试评论内容..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  游客昵称
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="测试游客"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  游客邮箱
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 测试按钮 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">测试操作</h2>
          
          <div className="flex space-x-4">
            <Button
              onClick={testGuestComment}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              variant="outline"
            >
              测试游客评论
            </Button>

            <Button
              onClick={testUserComment}
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              测试注册用户评论
            </Button>
          </div>
        </div>

        {/* 错误信息 */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        {/* 测试结果 */}
        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              测试结果 
              <span className={`ml-2 text-sm ${result.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                ({result.type === 'success' ? '成功' : '失败'})
              </span>
            </h2>
            
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
