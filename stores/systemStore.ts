import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

// 系统设置类型
export type SystemSettingType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'ARRAY'

// 系统设置分组
export type SystemSettingGroup = 'GENERAL' | 'SECURITY' | 'EMAIL' | 'MEDIA' | 'CONTENT' | 'USERS'

// 系统设置项
export interface SystemSetting {
  id: number
  key: string
  value: string
  type: SystemSettingType
  group: SystemSettingGroup
  description?: string
}

// 系统日志级别
export type SystemLogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

// 系统日志
export interface SystemLog {
  id: number
  level: SystemLogLevel
  module: string
  action: string
  message: string
  details?: string
  ipAddress?: string
  userAgent?: string
  userId?: number
  createdAt: string
}

// 系统备份类型
export type SystemBackupType = 'FULL' | 'DATABASE' | 'MEDIA' | 'SETTINGS'

// 系统备份状态
export type SystemBackupStatus = 'PENDING' | 'COMPLETED' | 'FAILED'

// 系统备份
export interface SystemBackup {
  id: number
  filename: string
  size: number
  type: SystemBackupType
  status: SystemBackupStatus
  notes?: string
  createdById?: number
  createdAt: string
  completedAt?: string
}

// 系统设置状态
interface SystemState {
  // 设置
  settings: SystemSetting[]
  isLoadingSettings: boolean
  settingsError: string | null

  // 日志
  logs: SystemLog[]
  isLoadingLogs: boolean
  logsError: string | null
  logsPagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }

  // 备份
  backups: SystemBackup[]
  isLoadingBackups: boolean
  backupsError: string | null

  // 操作
  fetchSettings: () => Promise<void>
  updateSetting: (key: string, value: string) => Promise<void>
  fetchLogs: (page?: number, limit?: number, filters?: Record<string, any>) => Promise<void>
  clearLogs: (filters?: Record<string, any>) => Promise<void>
  fetchBackups: () => Promise<void>
  createBackup: (type: SystemBackupType, notes?: string) => Promise<void>
  restoreBackup: (id: number) => Promise<void>
  deleteBackup: (id: number) => Promise<void>
}

// 创建系统设置状态管理
export const useSystemStore = create<SystemState>()(
  devtools(
    (set, get) => ({
      // 设置初始状态
      settings: [],
      isLoadingSettings: false,
      settingsError: null,

      logs: [],
      isLoadingLogs: false,
      logsError: null,
      logsPagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },

      backups: [],
      isLoadingBackups: false,
      backupsError: null,

      // 获取系统设置
      fetchSettings: async () => {
        try {
          set({ isLoadingSettings: true, settingsError: null })
          console.log('开始获取系统设置...');

          const response = await fetch('/api/v1/settings', {
            credentials: 'include', // 确保包含cookies，对于认证很重要
            headers: {
              'Content-Type': 'application/json',
            },
          })

          console.log('系统设置API响应状态:', response.status);

          if (!response.ok) {
            const error = await response.json()
            console.error('获取系统设置失败:', error);
            throw new Error(error.error?.message || '获取系统设置失败')
          }

          const data = await response.json()
          console.log('获取系统设置成功:', data);
          set({ settings: data.data, isLoadingSettings: false })
        } catch (error: any) {
          console.error('获取系统设置异常:', error);
          set({
            isLoadingSettings: false,
            settingsError: error.message || '获取系统设置失败'
          })
        }
      },

      // 更新系统设置
      updateSetting: async (key: string, value: string) => {
        try {
          const response = await fetch(`/api/v1/settings/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || '更新系统设置失败')
          }

          const data = await response.json()

          // 更新本地状态
          set(state => ({
            settings: state.settings.map(setting =>
              setting.key === key ? { ...setting, value } : setting
            )
          }))
        } catch (error: any) {
          set({ settingsError: error.message || '更新系统设置失败' })
          throw error
        }
      },

      // 获取系统日志
      fetchLogs: async (page = 1, limit = 20, filters = {}) => {
        try {
          set({ isLoadingLogs: true, logsError: null })
          console.log('开始获取系统日志...');

          const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...filters
          })

          console.log('系统日志查询参数:', queryParams.toString());

          const response = await fetch(`/api/v1/logs?${queryParams.toString()}`, {
            credentials: 'include', // 确保包含cookies，对于认证很重要
            headers: {
              'Content-Type': 'application/json',
            },
          })

          console.log('系统日志API响应状态:', response.status);

          if (!response.ok) {
            const error = await response.json()
            console.error('获取系统日志失败:', error);
            throw new Error(error.error?.message || '获取系统日志失败')
          }

          const data = await response.json()
          console.log('获取系统日志成功:', data);

          set({
            logs: data.data.items,
            logsPagination: data.data.pagination,
            isLoadingLogs: false
          })
        } catch (error: any) {
          console.error('获取系统日志异常:', error);
          set({
            isLoadingLogs: false,
            logsError: error.message || '获取系统日志失败'
          })
        }
      },

      // 清除系统日志
      clearLogs: async (filters = {}) => {
        try {
          const queryParams = new URLSearchParams(filters)

          const response = await fetch(`/api/v1/logs?${queryParams.toString()}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || '清除系统日志失败')
          }

          // 重新获取日志
          await get().fetchLogs()
        } catch (error: any) {
          set({ logsError: error.message || '清除系统日志失败' })
          throw error
        }
      },

      // 获取系统备份
      fetchBackups: async () => {
        try {
          set({ isLoadingBackups: true, backupsError: null })
          console.log('开始获取系统备份...');

          const response = await fetch('/api/v1/backups', {
            credentials: 'include', // 确保包含cookies，对于认证很重要
            headers: {
              'Content-Type': 'application/json',
            },
          })

          console.log('系统备份API响应状态:', response.status);

          if (!response.ok) {
            const error = await response.json()
            console.error('获取系统备份失败:', error);
            throw new Error(error.error?.message || '获取系统备份失败')
          }

          const data = await response.json()
          console.log('获取系统备份成功:', data);

          set({ backups: data.data, isLoadingBackups: false })
        } catch (error: any) {
          console.error('获取系统备份异常:', error);
          set({
            isLoadingBackups: false,
            backupsError: error.message || '获取系统备份失败'
          })
        }
      },

      // 创建系统备份
      createBackup: async (type: SystemBackupType, notes?: string) => {
        try {
          const response = await fetch('/api/v1/backups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, notes }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || '创建系统备份失败')
          }

          // 重新获取备份列表
          await get().fetchBackups()
        } catch (error: any) {
          set({ backupsError: error.message || '创建系统备份失败' })
          throw error
        }
      },

      // 恢复系统备份
      restoreBackup: async (id: number) => {
        try {
          const response = await fetch(`/api/v1/backups/${id}/restore`, {
            method: 'POST',
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || '恢复系统备份失败')
          }
        } catch (error: any) {
          set({ backupsError: error.message || '恢复系统备份失败' })
          throw error
        }
      },

      // 删除系统备份
      deleteBackup: async (id: number) => {
        try {
          const response = await fetch(`/api/v1/backups/${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || '删除系统备份失败')
          }

          // 更新本地状态
          set(state => ({
            backups: state.backups.filter(backup => backup.id !== id)
          }))
        } catch (error: any) {
          set({ backupsError: error.message || '删除系统备份失败' })
          throw error
        }
      },
    }),
    { name: 'system-store' }
  )
)
