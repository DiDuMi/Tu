export interface SocialAccount {
  id: number
  uuid: string
  userId: number
  provider: 'telegram' | 'github' | 'google'
  providerId: string
  username?: string
  displayName?: string
  email?: string
  avatar?: string
  accessToken?: string
  refreshToken?: string
  expiresAt?: Date
  metadata?: string
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface SocialAccountResponse extends Omit<SocialAccount, 'accessToken' | 'refreshToken'> {
  providerName: string
  canUnlink: boolean
}

export interface TelegramAuthData {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export interface SocialLoginProvider {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  isAvailable: boolean
}

export type SocialProvider = 'telegram' | 'github' | 'google'

export interface SocialAccountLinkRequest {
  provider: SocialProvider
  authData?: any
}

export interface SocialAccountUnlinkRequest {
  provider: SocialProvider
}
