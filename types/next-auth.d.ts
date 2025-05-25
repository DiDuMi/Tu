import NextAuth, { DefaultSession } from 'next-auth'
import { UserRole } from '@prisma/client'

declare module 'next-auth' {
  /**
   * 扩展Session类型，添加用户ID、角色和用户组ID
   */
  interface Session {
    user: {
      id: string
      role: string
      userGroupId?: number
    } & DefaultSession['user']
  }

  /**
   * 扩展User类型，添加角色和用户组ID
   */
  interface User {
    role: UserRole
    userGroupId?: number
  }
}

declare module 'next-auth/jwt' {
  /**
   * 扩展JWT类型，添加用户ID、角色和用户组ID
   */
  interface JWT {
    id: string
    role: string
    userGroupId?: number
  }
}
