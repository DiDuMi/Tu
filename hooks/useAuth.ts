import { useSession, signIn, signOut } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/router'

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface SignupCredentials {
  name: string
  email: string
  password: string
}

export function useAuth() {
  const { data: session, status } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'
  const user = session?.user

  const login = async (credentials: LoginCredentials, callbackUrl?: string) => {
    try {
      setLoading(true)
      setError(null)

      const result = await signIn('credentials', {
        redirect: false,
        email: credentials.email,
        password: credentials.password,
      })

      if (result?.error) {
        setError('邮箱或密码错误')
        return false
      }

      // 登录成功，重定向到回调URL或首页
      const redirectUrl = callbackUrl || (router.query.callbackUrl as string) || '/'
      router.push(redirectUrl)
      return true
    } catch (err) {
      console.error('登录失败:', err)
      setError('登录失败，请稍后重试')
      return false
    } finally {
      setLoading(false)
    }
  }

  const signup = async (credentials: SignupCredentials) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error?.message || '注册失败')
        return false
      }

      // 注册成功后自动登录
      return await login({
        email: credentials.email,
        password: credentials.password,
      })
    } catch (err) {
      console.error('注册失败:', err)
      setError('注册失败，请稍后重试')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = async (callbackUrl?: string) => {
    await signOut({ redirect: false })
    router.push(callbackUrl || '/')
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    loading,
    error,
    login,
    signup,
    logout,
  }
}
