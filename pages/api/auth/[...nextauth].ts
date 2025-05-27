import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GitHubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcrypt'
import { User } from '@prisma/client'
import { verifyTelegramAuth, processTelegramLoginData } from '@/lib/telegram-provider'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            userGroup: {
              select: {
                id: true,
                name: true,
                previewPercentage: true,
              }
            }
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          return null
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('账户未激活或已被禁用')
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          userGroupId: user.userGroupId || undefined,
        }
      }
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // 对于社交登录，检查用户状态
      if (account?.provider !== 'credentials' && account) {
        // 查找现有用户
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { socialAccounts: true }
        })

        if (existingUser) {
          // 检查用户状态
          if (existingUser.status !== 'ACTIVE') {
            throw new Error('账户未激活或已被禁用')
          }

          // 检查是否已关联此社交账号
          const socialAccount = existingUser.socialAccounts.find(
            sa => sa.provider === account.provider && sa.providerId === account.providerAccountId
          )

          if (!socialAccount) {
            // 创建社交账号关联
            await prisma.socialAccount.create({
              data: {
                userId: existingUser.id,
                provider: account.provider,
                providerId: account.providerAccountId!,
                username: (profile as any)?.login || (profile as any)?.username,
                displayName: user.name,
                email: user.email,
                avatar: user.image,
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
                isVerified: true,
              }
            })
          }
        }
      }
      return true
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.userGroupId = (user as any).userGroupId
        token.lastUpdated = Date.now()
      }

      // 定期刷新用户组信息（每5分钟检查一次）
      const now = Date.now()
      const lastUpdated = token.lastUpdated as number || 0
      const shouldRefresh = now - lastUpdated > 5 * 60 * 1000 // 5分钟

      if (token.id && shouldRefresh && !user) {
        try {
          const currentUser = await prisma.user.findUnique({
            where: { id: parseInt(token.id as string) },
            select: {
              userGroupId: true,
              role: true,
            },
          })

          if (currentUser) {
            token.userGroupId = currentUser.userGroupId || undefined
            token.role = currentUser.role
            token.lastUpdated = now
          }
        } catch (error) {
          console.error('刷新用户组信息失败:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.userGroupId = token.userGroupId as number
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30天
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
