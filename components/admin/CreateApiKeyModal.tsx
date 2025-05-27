import { useState } from 'react'

import { Button } from '@/components/ui/Button'

interface CreateApiKeyModalProps {
  onClose: () => void
  onSubmit: (data: any) => void
}

export default function CreateApiKeyModal({ onClose, onSubmit }: CreateApiKeyModalProps) {
  const [formData, setFormData] = useState({
    keyName: '',
    permissions: ['signin'],
    expiresAt: '',
    userId: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.keyName.trim()) {
      alert('请输入密钥名称')
      return
    }

    if (!formData.userId.trim()) {
      alert('请输入用户ID')
      return
    }

    if (formData.permissions.length === 0) {
      alert('请至少选择一个权限')
      return
    }

    onSubmit({
      keyName: formData.keyName.trim(),
      permissions: formData.permissions,
      expiresAt: formData.expiresAt || null,
      userId: parseInt(formData.userId)
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-card rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-dark-text">
          创建API密钥
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              密钥名称
            </label>
            <input
              type="text"
              value={formData.keyName}
              onChange={(e) => setFormData({ ...formData, keyName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-input dark:text-dark-text"
              placeholder="例如：Telegram Bot"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              用户ID
            </label>
            <input
              type="number"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-input dark:text-dark-text"
              placeholder="输入用户ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-2">
              权限
            </label>
            <div className="space-y-2">
              {[
                { value: 'signin', label: '签到权限' },
                { value: 'read_profile', label: '读取用户信息' },
                { value: 'read_points', label: '读取积分信息' }
              ].map((permission) => (
                <label key={permission.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          permissions: [...formData.permissions, permission.value]
                        })
                      } else {
                        setFormData({
                          ...formData,
                          permissions: formData.permissions.filter(p => p !== permission.value)
                        })
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-dark-text">
                    {permission.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
              过期时间（可选）
            </label>
            <input
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-input dark:text-dark-text"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              创建
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              取消
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
