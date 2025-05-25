import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { z } from 'zod'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

// 表单验证模式
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, '密码至少需要8个字符')
    .regex(/[A-Z]/, '密码需要包含至少一个大写字母')
    .regex(/[a-z]/, '密码需要包含至少一个小写字母')
    .regex(/[0-9]/, '密码需要包含至少一个数字'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof resetPasswordSchema>

enum ResetStatus {
  VALIDATING = 'validating',
  VALID = 'valid',
  INVALID = 'invalid',
  RESETTING = 'resetting',
  SUCCESS = 'success',
  ERROR = 'error',
}

export default function ResetPassword() {
  const router = useRouter()
  const { token } = router.query
  
  const [status, setStatus] = useState<ResetStatus>(ResetStatus.VALIDATING)
  const [message, setMessage] = useState<string>('')
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 验证重置令牌
  useEffect(() => {
    if (!token) return
    
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/v1/auth/validate-reset-token?token=${token}`)
        const data = await response.json()
        
        if (response.ok) {
          setStatus(ResetStatus.VALID)
        } else {
          setStatus(ResetStatus.INVALID)
          setMessage(data.error?.message || '重置密码链接无效或已过期')
        }
      } catch (error) {
        console.error('验证重置令牌失败:', error)
        setStatus(ResetStatus.INVALID)
        setMessage('验证重置令牌失败，请稍后重试')
      }
    }
    
    validateToken()
  }, [token])

  // 处理表单输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    
    // 清除字段错误
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证表单
    try {
      resetPasswordSchema.parse(formData)
      setErrors({})
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const field = err.path[0]
          fieldErrors[field as string] = err.message
        })
        setErrors(fieldErrors)
        return
      }
    }
    
    // 提交表单
    try {
      setStatus(ResetStatus.RESETTING)
      
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error?.message || '重置密码失败')
      }
      
      // 重置密码成功
      setStatus(ResetStatus.SUCCESS)
      setMessage(data.message || '密码重置成功！')
      
      // 3秒后重定向到登录页
      setTimeout(() => {
        router.push('/auth/signin')
      }, 3000)
    } catch (error: any) {
      console.error('重置密码失败:', error)
      setStatus(ResetStatus.ERROR)
      setMessage(error.message || '重置密码失败，请稍后重试')
    }
  }

  return (
    <>
      <Head>
        <title>重置密码 - 兔图</title>
        <meta name="description" content="重置您的兔图账户密码" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              重置密码
            </h2>
          </div>
          
          {status === ResetStatus.VALIDATING && (
            <div className="flex flex-col items-center justify-center py-8">
              <svg
                className="animate-spin h-10 w-10 text-primary-500 mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-600">正在验证重置链接...</p>
            </div>
          )}
          
          {status === ResetStatus.INVALID && (
            <div className="text-center">
              <Alert variant="error" className="mb-6">
                {message}
              </Alert>
              <p className="text-gray-600 mb-6">
                您的重置密码链接无效或已过期，请重新申请重置密码。
              </p>
              <Button
                onClick={() => router.push('/auth/forgot-password')}
                className="w-full"
              >
                重新申请重置密码
              </Button>
            </div>
          )}
          
          {status === ResetStatus.VALID && (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  新密码
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="请输入新密码"
                  error={errors.password}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-error-500">{errors.password}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  确认新密码
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="请再次输入新密码"
                  error={errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-500">{errors.confirmPassword}</p>
                )}
              </div>
              
              <div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={status === ResetStatus.RESETTING}
                  isLoading={status === ResetStatus.RESETTING}
                >
                  重置密码
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
          
          {status === ResetStatus.SUCCESS && (
            <div className="text-center">
              <Alert variant="success" className="mb-6">
                {message}
              </Alert>
              <p className="text-gray-600 mb-6">
                您的密码已成功重置，现在可以使用新密码登录您的账户了。
              </p>
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full"
              >
                前往登录
              </Button>
            </div>
          )}
          
          {status === ResetStatus.ERROR && (
            <div className="text-center">
              <Alert variant="error" className="mb-6">
                {message}
              </Alert>
              <p className="text-gray-600 mb-6">
                重置密码时出现了问题，请稍后重试或联系客服。
              </p>
              <div className="flex flex-col space-y-4">
                <Button
                  onClick={() => setStatus(ResetStatus.VALID)}
                  className="w-full"
                >
                  重试
                </Button>
                <Button
                  onClick={() => router.push('/auth/forgot-password')}
                  variant="outline"
                >
                  重新申请重置密码
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
