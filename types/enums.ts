/**
 * 用户角色枚举
 */
export enum UserRole {
  GUEST = 'GUEST',
  REGISTERED = 'REGISTERED',
  MEMBER = 'MEMBER',
  ANNUAL_MEMBER = 'ANNUAL_MEMBER',
  OPERATOR = 'OPERATOR',
  ADMIN = 'ADMIN',
}

/**
 * 用户状态枚举
 */
export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

/**
 * 页面状态枚举
 */
export enum PageStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * 媒体类型枚举
 */
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  CLOUD_VIDEO = 'CLOUD_VIDEO',
}

/**
 * 媒体存储类型枚举
 */
export enum MediaStorageType {
  LOCAL = 'LOCAL',
  CLOUD = 'CLOUD',
}

/**
 * 媒体状态枚举
 */
export enum MediaStatus {
  ACTIVE = 'ACTIVE',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR',
}
