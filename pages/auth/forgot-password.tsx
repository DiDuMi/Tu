import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { z } from 'zod'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// 表单验证模式
const forgotPasswordSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
})

type FormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPassword() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证表单
    try {
      forgotPasswordSchema.parse({ email })
      setError(null)
    } catch (error) {
      if (error instanceof z.ZodError) {
        setError(error.errors[0].message)
        return
      }
    }
    
    // 提交表单
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || '发送重置密码邮件失败')
      }
      
      // 成功发送重置密码邮件
      setIsSuccess(true)
    } catch (error: any) {
      console.error('发送重置密码邮件失败:', error)
      setError(error.message || '发送重置密码邮件失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>忘记密码 - 兔图</title>
        <meta name="description" content="重置您的兔图账户密码" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              忘记密码
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              请输入您的邮箱地址，我们将向您发送重置密码的链接
            </p>
          </div>
          
          {error && (
            <Alert variant="error" className="mt-4">
              {error}
            </Alert>
          )}
          
          {isSuccess ? (
            <div className="mt-8">
              <Alert variant="success" className="mb-6">
                重置密码邮件已发送！请查收您的邮箱。
              </Alert>
              <p className="text-sm text-gray-600 mb-6">
                我们已向您的邮箱 {email} 发送了一封包含重置密码链接的邮件。
                请查收并点击邮件中的链接重置您的密码。
              </p>
              <p className="text-sm text-gray-600 mb-6">
                如果您没有收到邮件，请检查垃圾邮件文件夹，或者
                <button
                  onClick={handleSubmit}
                  className="text-primary-600 hover:text-primary-500 ml-1"
                  disabled={isLoading}
                >
                  重新发送
                </button>
              </p>
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full"
              >
                返回登录
              </Button>
            </div>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入您的邮箱地址"
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  isLoading={isLoading}
                >
                  发送重置密码邮件
                </Button>
              </div>
              
              <div className="text-center">
                <Link
                  href="/auth/signin"
                  className="text-sm text-primary-600 hover:text-primary-500"
                >
                  返回登录
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
