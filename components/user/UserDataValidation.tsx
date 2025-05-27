// 用户数据验证工具

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface UserImportData {
  name: string
  email: string
  role?: string
  status?: string
  userGroup?: string
}

// 验证邮箱格式
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 验证用户名
export function validateUserName(name: string): boolean {
  return name && name.trim().length >= 2 && name.trim().length <= 50
}

// 验证角色
export function validateRole(role?: string): boolean {
  if (!role) return true // 角色是可选的
  const validRoles = ['ADMIN', 'OPERATOR', 'ANNUAL_MEMBER', 'MEMBER', 'REGISTERED', 'GUEST']
  return validRoles.includes(role.toUpperCase())
}

// 验证状态
export function validateStatus(status?: string): boolean {
  if (!status) return true // 状态是可选的
  const validStatuses = ['ACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED']
  return validStatuses.includes(status.toUpperCase())
}

// 验证单个用户数据
export function validateUserData(userData: UserImportData, rowIndex: number): ValidationResult {
  const errors: string[] = []

  // 验证必填字段
  if (!userData.name || !userData.name.trim()) {
    errors.push(`第${rowIndex}行：用户名不能为空`)
  } else if (!validateUserName(userData.name)) {
    errors.push(`第${rowIndex}行：用户名长度必须在2-50个字符之间`)
  }

  if (!userData.email || !userData.email.trim()) {
    errors.push(`第${rowIndex}行：邮箱不能为空`)
  } else if (!validateEmail(userData.email)) {
    errors.push(`第${rowIndex}行：邮箱格式不正确`)
  }

  // 验证可选字段
  if (userData.role && !validateRole(userData.role)) {
    errors.push(`第${rowIndex}行：角色值无效，支持的角色：ADMIN, OPERATOR, ANNUAL_MEMBER, MEMBER, REGISTERED, GUEST`)
  }

  if (userData.status && !validateStatus(userData.status)) {
    errors.push(`第${rowIndex}行：状态值无效，支持的状态：ACTIVE, PENDING, REJECTED, SUSPENDED`)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// 验证批量用户数据
export function validateBatchUserData(usersData: UserImportData[]): ValidationResult {
  const allErrors: string[] = []
  const emailSet = new Set<string>()

  usersData.forEach((userData, index) => {
    const rowIndex = index + 2 // 考虑标题行，所以从第2行开始

    // 验证单个用户数据
    const validation = validateUserData(userData, rowIndex)
    allErrors.push(...validation.errors)

    // 检查邮箱重复
    if (userData.email) {
      const email = userData.email.toLowerCase().trim()
      if (emailSet.has(email)) {
        allErrors.push(`第${rowIndex}行：邮箱 ${userData.email} 在导入数据中重复`)
      } else {
        emailSet.add(email)
      }
    }
  })

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  }
}

// 解析CSV数据
export function parseCSVData(csvText: string): UserImportData[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const data: UserImportData[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const userData: any = {}

    headers.forEach((header, index) => {
      if (values[index]) {
        userData[header] = values[index]
      }
    })

    // 映射字段名
    const mappedData: UserImportData = {
      name: userData.name || userData.username || userData['用户名'] || '',
      email: userData.email || userData['邮箱'] || '',
      role: userData.role || userData['角色'] || '',
      status: userData.status || userData['状态'] || '',
      userGroup: userData.usergroup || userData.user_group || userData['用户组'] || ''
    }

    data.push(mappedData)
  }

  return data
}

// 格式化验证错误信息
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return ''
  
  return `发现 ${errors.length} 个验证错误：\n${errors.join('\n')}`
}
