import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'

enum VerificationStatus {
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
  EXPIRED = 'expired',
}

export default function VerifyEmail() {
  const router = useRouter()
  const { token } = router.query
  
  const [status, setStatus] = useState<VerificationStatus>(VerificationStatus.LOADING)
  const [message, setMessage] = useState<string>('')
  
  useEffect(() => {
    // 只有当token存在时才验证
    if (!token) return
    
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/v1/auth/verify-email?token=${token}`)
        const data = await response.json()
        
        if (response.ok) {
          setStatus(VerificationStatus.SUCCESS)
          setMessage(data.message || '邮箱验证成功！')
        } else {
          if (data.error?.code === 'TOKEN_EXPIRED') {
            setStatus(VerificationStatus.EXPIRED)
            setMessage(data.error.message || '验证链接已过期，请重新发送验证邮件')
          } else {
            setStatus(VerificationStatus.ERROR)
            setMessage(data.error?.message || '邮箱验证失败，请稍后重试')
          }
        }
      } catch (error) {
        console.error('验证邮箱失败:', error)
        setStatus(VerificationStatus.ERROR)
        setMessage('验证邮箱失败，请稍后重试')
      }
    }
    
    verifyEmail()
  }, [token])
  
  // 重新发送验证邮件
  const handleResendVerification = async () => {
    try {
      setStatus(VerificationStatus.LOADING)
      
      const response = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setStatus(VerificationStatus.SUCCESS)
        setMessage(data.message || '验证邮件已重新发送，请查收')
      } else {
        setStatus(VerificationStatus.ERROR)
        setMessage(data.error?.message || '发送验证邮件失败，请稍后重试')
      }
    } catch (error) {
      console.error('发送验证邮件失败:', error)
      setStatus(VerificationStatus.ERROR)
      setMessage('发送验证邮件失败，请稍后重试')
    }
  }
  
  return (
    <>
      <Head>
        <title>邮箱验证 - 兔图</title>
        <meta name="description" content="验证您的兔图账户邮箱" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              邮箱验证
            </h2>
          </div>
          
          <div className="mt-8">
            {status === VerificationStatus.LOADING && (
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
                <p className="text-gray-600">正在验证您的邮箱...</p>
              </div>
            )}
            
            {status === VerificationStatus.SUCCESS && (
              <div className="text-center">
                <Alert variant="success" className="mb-6">
                  {message}
                </Alert>
                <p className="text-gray-600 mb-6">
                  您的邮箱已成功验证，现在可以登录您的账户了。
                </p>
                <Button
                  onClick={() => router.push('/auth/signin')}
                  className="w-full"
                >
                  前往登录
                </Button>
              </div>
            )}
            
            {status === VerificationStatus.ERROR && (
              <div className="text-center">
                <Alert variant="error" className="mb-6">
                  {message}
                </Alert>
                <p className="text-gray-600 mb-6">
                  验证您的邮箱时出现了问题，请稍后重试或联系客服。
                </p>
                <div className="flex flex-col space-y-4">
                  <Button
                    onClick={() => router.push('/')}
                    variant="outline"
                  >
                    返回首页
                  </Button>
                  <Button
                    onClick={() => router.push('/auth/signin')}
                  >
                    前往登录
                  </Button>
                </div>
              </div>
            )}
            
            {status === VerificationStatus.EXPIRED && (
              <div className="text-center">
                <Alert variant="warning" className="mb-6">
                  {message}
                </Alert>
                <p className="text-gray-600 mb-6">
                  您的验证链接已过期，请点击下方按钮重新发送验证邮件。
                </p>
                <div className="flex flex-col space-y-4">
                  <Button
                    onClick={handleResendVerification}
                    className="w-full"
                  >
                    重新发送验证邮件
                  </Button>
                  <Button
                    onClick={() => router.push('/auth/signin')}
                    variant="outline"
                  >
                    返回登录
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
