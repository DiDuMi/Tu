import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { z } from 'zod'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Checkbox'

// 注册表单验证模式
const signupSchema = z.object({
  name: z.string().min(2, '用户名至少需要2个字符').max(50, '用户名不能超过50个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码至少需要6个字符')
    .max(100, '密码不能超过100个字符')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
      '密码必须包含小写字母、大写字母、数字和特殊字符'
    ),
  confirmPassword: z.string(),
  // 新增选填字段
  telegramUsername: z.string().max(50, 'Telegram用户名不能超过50个字符').optional(),
  telegramId: z.string().max(50, 'Telegram ID不能超过50个字符').optional(),
  applicationReason: z.string().max(500, '申请原因不能超过500个字符').optional(),
  agreeTerms: z.literal(true, {
    errorMap: () => ({ message: '您需要同意服务条款和隐私政策' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

// 表单字段类型
type FormData = Omit<z.infer<typeof signupSchema>, 'agreeTerms'> & {
  agreeTerms: boolean
}

export default function SignUp() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    telegramUsername: '',
    telegramId: '',
    applicationReason: '',
    agreeTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // 处理表单输入变化
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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
      signupSchema.parse(formData)
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
      setIsLoading(true)
      setGeneralError(null)

      const response = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          telegramUsername: formData.telegramUsername || undefined,
          telegramId: formData.telegramId || undefined,
          applicationReason: formData.applicationReason || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || '注册失败')
      }

      // 注册成功
      setIsSuccess(true)

      // 3秒后重定向到登录页
      setTimeout(() => {
        router.push('/auth/signin')
      }, 3000)
    } catch (error: any) {
      console.error('注册失败:', error)
      setGeneralError(error.message || '注册失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>注册 - 兔图</title>
        <meta name="description" content="注册兔图内容管理平台账户" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              创建新账户
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              或{' '}
              <Link href="/auth/signin" className="font-medium text-primary-600 hover:text-primary-500">
                登录已有账户
              </Link>
            </p>

            {/* 会员制声明 */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    会员制说明
                  </h3>
                  <div className="mt-1 text-sm text-blue-700">
                    <p>本站采取会员制管理，注册用户需要管理员在 <strong>7个工作日内</strong> 审核批准后方可使用。</p>
                    <p className="mt-1">请填写详细的申请原因以提高审核通过率。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {generalError && (
            <Alert variant="destructive" className="mt-4">
              {generalError}
            </Alert>
          )}

          {isSuccess && (
            <Alert variant="success" className="mt-4">
              注册成功！您的申请已提交，请等待管理员审核。审核通过后您将收到邮件通知。正在跳转到登录页面...
            </Alert>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  用户名
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="请输入用户名"
                  disabled={isLoading || isSuccess}
                  error={errors.name}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error-500">{errors.name}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱地址
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="请输入邮箱地址"
                  disabled={isLoading || isSuccess}
                  error={errors.email}
                />
                <p className="mt-1 text-xs text-blue-600">
                  💡 如果您在社群机器人 @GuiYaoBot 已经绑定邮箱，建议使用绑定邮箱注册
                </p>
                {errors.email && (
                  <p className="mt-1 text-sm text-error-500">{errors.email}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  密码
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="请输入密码"
                  disabled={isLoading || isSuccess}
                  error={errors.password}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-error-500">{errors.password}</p>
                )}
              </div>

              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  确认密码
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="请再次输入密码"
                  disabled={isLoading || isSuccess}
                  error={errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error-500">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* 选填信息区域 */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">选填信息</h3>
              <p className="text-sm text-gray-600 mb-4">
                以下信息为选填项，填写后有助于管理员更好地了解您的申请
              </p>

              <div className="space-y-4">
                {/* Telegram 用户名 */}
                <div>
                  <label htmlFor="telegramUsername" className="block text-sm font-medium text-gray-700 mb-1">
                    Telegram 用户名
                  </label>
                  <Input
                    id="telegramUsername"
                    name="telegramUsername"
                    type="text"
                    value={formData.telegramUsername}
                    onChange={handleChange}
                    placeholder="请输入您的 Telegram 用户名（不含@符号）"
                    disabled={isLoading || isSuccess}
                    error={errors.telegramUsername}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    例如：username（不需要输入@符号）
                  </p>
                  {errors.telegramUsername && (
                    <p className="mt-1 text-sm text-error-500">{errors.telegramUsername}</p>
                  )}
                </div>

                {/* Telegram ID */}
                <div>
                  <label htmlFor="telegramId" className="block text-sm font-medium text-gray-700 mb-1">
                    Telegram ID
                  </label>
                  <Input
                    id="telegramId"
                    name="telegramId"
                    type="text"
                    value={formData.telegramId}
                    onChange={handleChange}
                    placeholder="请输入您的 Telegram ID"
                    disabled={isLoading || isSuccess}
                    error={errors.telegramId}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    可通过 @userinfobot 获取您的 Telegram ID
                  </p>
                  {errors.telegramId && (
                    <p className="mt-1 text-sm text-error-500">{errors.telegramId}</p>
                  )}
                </div>

                {/* 申请原因 */}
                <div>
                  <label htmlFor="applicationReason" className="block text-sm font-medium text-gray-700 mb-1">
                    申请原因
                  </label>
                  <textarea
                    id="applicationReason"
                    name="applicationReason"
                    rows={4}
                    value={formData.applicationReason}
                    onChange={handleChange}
                    placeholder="请简要说明您申请加入的原因，这将有助于管理员审核您的申请"
                    disabled={isLoading || isSuccess}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-500"
                    maxLength={500}
                  />
                  <div className="mt-1 flex justify-between">
                    <p className="text-xs text-gray-500">
                      详细的申请原因有助于提高审核通过率
                    </p>
                    <p className="text-xs text-gray-400">
                      {formData.applicationReason?.length || 0}/500
                    </p>
                  </div>
                  {errors.applicationReason && (
                    <p className="mt-1 text-sm text-error-500">{errors.applicationReason}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <Checkbox
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                disabled={isLoading || isSuccess}
              />
              <label htmlFor="agreeTerms" className="ml-2 block text-sm text-gray-900">
                我已阅读并同意
                <Link href="/terms" className="text-primary-600 hover:text-primary-500 mx-1">
                  服务条款
                </Link>
                和
                <Link href="/privacy" className="text-primary-600 hover:text-primary-500 ml-1">
                  隐私政策
                </Link>
              </label>
            </div>
            {errors.agreeTerms && (
              <p className="mt-1 text-sm text-error-500">{errors.agreeTerms}</p>
            )}

            <div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isSuccess}
              >
                {isLoading ? '注册中...' : '注册'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
