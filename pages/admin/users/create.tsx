import { useEffect, useState } from 'react'
import { GetServerSideProps } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { useRouter } from 'next/router'
import Link from 'next/link'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/Alert'
import { isAdmin } from '@/lib/permissions'
import { useForm } from '@/hooks/useForm'
import { useMutation } from '@/hooks/useFetch'
import { useFetch } from '@/hooks/useFetch'
import { z } from 'zod'
import { UserGroup } from '@/stores/adminUserStore'

// 表单验证模式
const createUserSchema = z.object({
  name: z.string().min(2, '姓名至少需要2个字符').max(50, '姓名不能超过50个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码至少需要6个字符')
    .max(100, '密码不能超过100个字符'),
  role: z.string().min(1, '请选择用户角色'),
  status: z.string().min(1, '请选择用户状态'),
  userGroupId: z.string().optional(),
})

type CreateUserForm = z.infer<typeof createUserSchema>

export default function CreateUser() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // 获取用户组列表
  const { data: userGroupsData } = useFetch<{ items: UserGroup[] }>(
    mounted ? '/api/v1/user-groups?limit=100' : null
  )

  // 创建用户的API调用
  const { post: createUser, loading: createLoading, error: createError } = useMutation('/api/v1/users')

  // 表单处理
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
  } = useForm<CreateUserForm>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      role: 'REGISTERED',
      status: 'ACTIVE',
      userGroupId: '',
    },
    validationSchema: createUserSchema,
    onSubmit: async (values) => {
      try {
        // 转换userGroupId为数字或undefined
        const userGroupId = values.userGroupId ? parseInt(values.userGroupId) : undefined

        console.log('提交表单数据:', {
          ...values,
          userGroupId,
          password: values.password ? '******' : undefined,
          passwordLength: values.password ? values.password.length : 0
        })

        // 检查密码是否符合基本要求
        if (values.password && values.password.length < 6) {
          alert('密码长度不足6个字符');
          return;
        }

        // 尝试使用原始API进行请求
        const response = await fetch('/api/v1/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            password: values.password,
            role: values.role || 'REGISTERED',
            status: values.status || 'ACTIVE',
            userGroupId,
          }),
        });

        const result = await response.json();
        console.log('API响应结果:', result);

        if (!response.ok) {
          throw new Error(result.error?.message || '创建用户失败');
        }

        if (result.success) {
          // 创建成功，清除SWR缓存并跳转到用户列表页
          const { mutate } = await import('swr');

          // 全局缓存失效，确保所有用户相关的API请求都会重新获取数据
          await mutate((key) => typeof key === 'string' && key.startsWith('/api/v1/users'), undefined, { revalidate: true });

          // 显示成功消息
          alert('用户创建成功！');

          // 跳转到用户列表页
          router.push('/admin/users');
        }
      } catch (error) {
        console.error('创建用户失败:', error);

        // 获取详细错误信息
        let errorMessage = '创建用户失败，请稍后重试';

        if (error instanceof Error) {
          errorMessage = error.message;
        }

        // 显示错误信息
        alert(errorMessage);

        // 如果是密码相关错误，添加提示
        if (errorMessage.toLowerCase().includes('password') ||
            errorMessage.toLowerCase().includes('密码')) {
          alert('提示：密码至少需要6个字符，建议使用包含字母、数字和特殊字符的强密码');
        }
      }
    },
  })

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <AdminLayout title="创建用户 - 兔图管理后台">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">创建用户</h1>
          <p className="mt-1 text-sm text-gray-500">
            添加新用户到系统
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/admin/users">
            <Button variant="outline">
              返回用户列表
            </Button>
          </Link>
        </div>
      </div>

      {createError && (
        <Alert variant="error" className="mb-6">
          <AlertTitle>创建失败</AlertTitle>
          <AlertDescription>
            {typeof createError === 'string'
              ? createError
              : createError instanceof Error
                ? createError.message
                : '创建用户时发生错误，请稍后重试'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>用户信息</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="用户名"
                name="name"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.name && errors.name ? errors.name : undefined}
                required
              />
              <Input
                label="邮箱"
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.email && errors.email ? errors.email : undefined}
                required
              />
            </div>

            <Input
              label="密码"
              type="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password && errors.password ? errors.password : undefined}
              helperText="密码至少需要6个字符，建议使用包含字母、数字和特殊字符的强密码"
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="角色"
                name="role"
                value={values.role}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.role && errors.role ? errors.role : undefined}
                options={[
                  { value: 'REGISTERED', label: '注册用户' },
                  { value: 'MEMBER', label: '会员' },
                  { value: 'ANNUAL_MEMBER', label: '年度会员' },
                  { value: 'OPERATOR', label: '操作员' },
                  { value: 'ADMIN', label: '管理员' },
                ]}
                required
              />
              <Select
                label="状态"
                name="status"
                value={values.status}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.status && errors.status ? errors.status : undefined}
                options={[
                  { value: 'ACTIVE', label: '活跃' },
                  { value: 'PENDING', label: '待审核' },
                  { value: 'SUSPENDED', label: '已禁用' },
                ]}
                required
              />
            </div>

            <Select
              label="用户组"
              name="userGroupId"
              value={values.userGroupId}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.userGroupId && errors.userGroupId ? errors.userGroupId : undefined}
              options={[
                { value: '', label: '选择用户组（可选）' },
                ...((userGroupsData as any)?.data?.items || []).map((group: any) => ({
                  value: group.id.toString(),
                  label: group.name,
                })),
              ]}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/users')}
            >
              取消
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting || createLoading}
              disabled={isSubmitting || createLoading}
            >
              创建用户
            </Button>
          </CardFooter>
        </form>
      </Card>
    </AdminLayout>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  // 检查用户是否有权限访问管理后台
  if (!session || !isAdmin(session)) {
    return {
      redirect: {
        destination: '/auth/signin?callbackUrl=/admin/users/create',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
