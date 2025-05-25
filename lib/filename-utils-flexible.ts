/**
 * 更灵活的文件名处理工具
 * 支持中文字符，提供更友好的文件名处理策略
 */

import path from 'path'

/**
 * 文件名验证结果接口
 */
export interface FlexibleFilenameValidationResult {
  isValid: boolean
  issues: string[]
  suggestions: string[]
  severity: 'low' | 'medium' | 'high'
  canAutoFix: boolean
  autoFixedName?: string
}

/**
 * 文件名处理策略配置
 */
export interface FilenamePolicy {
  allowChinese: boolean          // 是否允许中文字符
  allowSpaces: boolean           // 是否允许空格
  allowEmoji: boolean            // 是否允许emoji
  allowSpecialChars: boolean     // 是否允许特殊字符
  maxLength: number              // 最大文件名长度
  autoConvert: boolean           // 是否自动转换而非拒绝
}

/**
 * 默认的宽松策略
 */
export const FLEXIBLE_POLICY: FilenamePolicy = {
  allowChinese: true,
  allowSpaces: true,
  allowEmoji: false,
  allowSpecialChars: false,
  maxLength: 200,
  autoConvert: true
}

/**
 * 严格策略（原有的策略）
 */
export const STRICT_POLICY: FilenamePolicy = {
  allowChinese: false,
  allowSpaces: false,
  allowEmoji: false,
  allowSpecialChars: false,
  maxLength: 100,
  autoConvert: true
}

/**
 * 中等策略
 */
export const MODERATE_POLICY: FilenamePolicy = {
  allowChinese: true,
  allowSpaces: false,
  allowEmoji: false,
  allowSpecialChars: false,
  maxLength: 150,
  autoConvert: true
}

/**
 * 中文字符转拼音映射（简化版）
 */
const CHINESE_TO_PINYIN: Record<string, string> = {
  '视频': 'shipin',
  '音频': 'yinpin',
  '图片': 'tupian',
  '文件': 'wenjian',
  '测试': 'ceshi',
  '演示': 'yanshi',
  '教程': 'jiaocheng',
  '课程': 'kecheng',
  '电影': 'dianying',
  '音乐': 'yinyue',
  '照片': 'zhaopian',
  '录像': 'luxiang',
  '直播': 'zhibo',
  '会议': 'huiyi',
  '培训': 'peixun',
  '讲座': 'jiangzuo'
}

/**
 * 智能清理文件名（支持中文）
 * @param filename 原始文件名
 * @param policy 处理策略
 * @returns 清理后的文件名
 */
export function smartSanitizeFilename(filename: string, policy: FilenamePolicy = FLEXIBLE_POLICY): string {
  if (!filename || typeof filename !== 'string') {
    return 'file'
  }

  // 获取文件扩展名
  const ext = path.extname(filename)
  let name = path.basename(filename, ext)

  // 处理文件名长度
  if (name.length > policy.maxLength) {
    name = name.substring(0, policy.maxLength)
  }

  // 根据策略处理不同类型的字符
  if (!policy.allowEmoji) {
    // 移除emoji
    name = name.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu, '')
  }

  if (!policy.allowSpecialChars) {
    // 移除系统保留字符
    name = name.replace(/[<>:"|?*\\\/]/g, '')
    // 移除其他特殊字符，但保留中文、字母、数字、下划线、连字符、点
    if (policy.allowChinese) {
      name = name.replace(/[^\w\u4e00-\u9fa5\-_.]/g, '_')
    } else {
      name = name.replace(/[^\w\-_.]/g, '_')
    }
  }

  if (!policy.allowSpaces) {
    // 将空格替换为下划线
    name = name.replace(/\s+/g, '_')
  }

  if (!policy.allowChinese && policy.autoConvert) {
    // 尝试将常见中文词汇转换为拼音
    for (const [chinese, pinyin] of Object.entries(CHINESE_TO_PINYIN)) {
      name = name.replace(new RegExp(chinese, 'g'), pinyin)
    }
    // 移除剩余的中文字符
    name = name.replace(/[\u4e00-\u9fa5]/g, '')
  }

  // 清理连续的下划线和点
  name = name.replace(/[_]{2,}/g, '_')
  name = name.replace(/[.]{2,}/g, '.')
  
  // 移除开头和结尾的下划线和点
  name = name.replace(/^[_.]+|[_.]+$/g, '')

  // 确保文件名不为空
  if (!name) {
    name = 'file'
  }

  // 转换为小写（可选，根据需要调整）
  if (!policy.allowChinese) {
    name = name.toLowerCase()
  }

  return `${name}${ext.toLowerCase()}`
}

/**
 * 灵活的文件名验证
 * @param filename 文件名
 * @param policy 验证策略
 * @returns 验证结果
 */
export function flexibleValidateFilename(
  filename: string, 
  policy: FilenamePolicy = FLEXIBLE_POLICY
): FlexibleFilenameValidationResult {
  const issues: string[] = []
  const suggestions: string[] = []
  let severity: 'low' | 'medium' | 'high' = 'low'
  let canAutoFix = true

  if (!filename || typeof filename !== 'string') {
    return {
      isValid: false,
      issues: ['文件名为空或无效'],
      suggestions: ['请提供有效的文件名'],
      severity: 'high',
      canAutoFix: false
    }
  }

  // 检查文件名长度
  if (filename.length > policy.maxLength) {
    issues.push(`文件名过长（超过${policy.maxLength}字符）`)
    suggestions.push('自动截断文件名')
    severity = 'medium'
  }

  // 检查emoji
  if (!policy.allowEmoji && /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(filename)) {
    issues.push('包含emoji字符')
    suggestions.push('自动移除emoji字符')
    severity = policy.autoConvert ? 'medium' : 'high'
  }

  // 检查系统保留字符
  if (/[<>:"|?*\\\/]/.test(filename)) {
    issues.push('包含系统保留字符')
    suggestions.push('自动移除保留字符')
    severity = 'high'
  }

  // 检查特殊字符
  if (!policy.allowSpecialChars) {
    const specialCharsRegex = policy.allowChinese 
      ? /[^\w\u4e00-\u9fa5\-_.\s]/
      : /[^\w\-_.\s]/
    
    if (specialCharsRegex.test(filename)) {
      issues.push('包含特殊字符')
      suggestions.push('自动替换特殊字符为下划线')
      severity = severity === 'high' ? 'high' : 'medium'
    }
  }

  // 检查中文字符
  if (!policy.allowChinese && /[\u4e00-\u9fa5]/.test(filename)) {
    issues.push('包含中文字符')
    if (policy.autoConvert) {
      suggestions.push('自动转换为拼音或移除')
    } else {
      suggestions.push('请使用英文文件名')
      severity = 'high'
      canAutoFix = false
    }
  }

  // 检查空格
  if (!policy.allowSpaces && /\s/.test(filename)) {
    issues.push('包含空格')
    suggestions.push('自动替换空格为下划线')
    severity = severity === 'high' ? 'high' : 'low'
  }

  // 检查以点开头的文件名
  if (filename.startsWith('.')) {
    issues.push('文件名以点开头')
    suggestions.push('避免创建隐藏文件')
    severity = severity === 'high' ? 'high' : 'low'
  }

  // 生成自动修复的文件名
  let autoFixedName: string | undefined
  if (canAutoFix && issues.length > 0) {
    autoFixedName = smartSanitizeFilename(filename, policy)
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    severity,
    canAutoFix,
    autoFixedName
  }
}

/**
 * 获取文件名处理建议
 * @param filename 原始文件名
 * @param policy 处理策略
 * @returns 处理建议
 */
export function getFilenameAdvice(filename: string, policy: FilenamePolicy = FLEXIBLE_POLICY) {
  const validation = flexibleValidateFilename(filename, policy)
  
  return {
    original: filename,
    validation,
    recommended: validation.autoFixedName || filename,
    needsChange: !validation.isValid,
    canAutoFix: validation.canAutoFix,
    riskLevel: validation.severity
  }
}

/**
 * 批量分析文件名
 * @param filenames 文件名列表
 * @param policy 处理策略
 * @returns 分析结果
 */
export function analyzeFilenames(filenames: string[], policy: FilenamePolicy = FLEXIBLE_POLICY) {
  const results = filenames.map(filename => getFilenameAdvice(filename, policy))
  
  const summary = {
    total: filenames.length,
    valid: results.filter(r => r.validation.isValid).length,
    needsChange: results.filter(r => r.needsChange).length,
    canAutoFix: results.filter(r => r.canAutoFix).length,
    highRisk: results.filter(r => r.riskLevel === 'high').length,
    mediumRisk: results.filter(r => r.riskLevel === 'medium').length,
    lowRisk: results.filter(r => r.riskLevel === 'low').length
  }

  return {
    results,
    summary,
    recommendations: {
      useFlexiblePolicy: summary.highRisk < summary.total * 0.3,
      allowChinese: results.some(r => /[\u4e00-\u9fa5]/.test(r.original)),
      allowSpaces: results.some(r => /\s/.test(r.original))
    }
  }
}

/**
 * 生成文件名处理报告
 * @param analysis 分析结果
 * @returns 报告文本
 */
export function generateFilenameReport(analysis: ReturnType<typeof analyzeFilenames>): string {
  const { results, summary, recommendations } = analysis
  
  let report = `# 文件名分析报告\n\n`
  report += `## 📊 统计信息\n`
  report += `- 总文件数: ${summary.total}\n`
  report += `- 有效文件名: ${summary.valid}\n`
  report += `- 需要修改: ${summary.needsChange}\n`
  report += `- 可自动修复: ${summary.canAutoFix}\n`
  report += `- 高风险: ${summary.highRisk}\n`
  report += `- 中风险: ${summary.mediumRisk}\n`
  report += `- 低风险: ${summary.lowRisk}\n\n`

  report += `## 🎯 建议策略\n`
  if (recommendations.useFlexiblePolicy) {
    report += `- ✅ 建议使用灵活策略（FLEXIBLE_POLICY）\n`
  } else {
    report += `- ⚠️ 建议使用严格策略（STRICT_POLICY）\n`
  }
  
  if (recommendations.allowChinese) {
    report += `- 🈶 检测到中文文件名，建议允许中文字符\n`
  }
  
  if (recommendations.allowSpaces) {
    report += `- 🔤 检测到空格，建议允许空格或自动转换\n`
  }

  report += `\n## 📋 详细分析\n\n`
  
  // 只显示有问题的文件
  const problematicFiles = results.filter(r => !r.validation.isValid)
  
  if (problematicFiles.length > 0) {
    report += `### ❌ 需要处理的文件\n\n`
    report += `| 原文件名 | 问题 | 建议文件名 | 风险等级 |\n`
    report += `|----------|------|------------|----------|\n`
    
    problematicFiles.forEach(result => {
      const issues = result.validation.issues.join(', ')
      const recommended = result.recommended
      const risk = result.riskLevel === 'high' ? '🔴' : 
                   result.riskLevel === 'medium' ? '🟡' : '🟢'
      
      report += `| ${result.original} | ${issues} | ${recommended} | ${risk} ${result.riskLevel} |\n`
    })
  } else {
    report += `### ✅ 所有文件名都符合要求\n`
  }

  return report
}

export { CHINESE_TO_PINYIN }
