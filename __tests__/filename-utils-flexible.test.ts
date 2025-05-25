/**
 * 文件名处理工具函数测试
 */

import {
  smartSanitizeFilename,
  flexibleValidateFilename,
  getFilenameAdvice,
  analyzeFilenames,
  FLEXIBLE_POLICY,
  STRICT_POLICY,
  MODERATE_POLICY
} from '../lib/filename-utils-flexible'

describe('文件名处理工具函数测试', () => {
  describe('smartSanitizeFilename', () => {
    test('应该正确清理包含特殊字符的文件名', () => {
      const input = '🔗🎈🎬@#$%tg_coserdh*.mp4'
      const result = smartSanitizeFilename(input, STRICT_POLICY)
      expect(result).toBe('tg_coserdh.mp4')
    })

    test('应该保留安全字符', () => {
      const input = 'normal_file-123.mp4'
      const result = smartSanitizeFilename(input, STRICT_POLICY)
      expect(result).toBe('normal_file-123.mp4')
    })

    test('应该处理空文件名', () => {
      const input = ''
      const result = smartSanitizeFilename(input, STRICT_POLICY)
      expect(result).toBe('file')
    })

    test('应该处理中文文件名', () => {
      const input = '测试文件.mp4'
      const result = smartSanitizeFilename(input, FLEXIBLE_POLICY)
      expect(result).toBe('测试文件.mp4')
    })

    test('应该转换中文文件名（严格模式）', () => {
      const input = '测试文件.mp4'
      const result = smartSanitizeFilename(input, STRICT_POLICY)
      expect(result).toBe('ceshi.mp4')
    })
  })

  describe('flexibleValidateFilename', () => {
    test('应该验证安全文件名为有效', () => {
      const result = flexibleValidateFilename('safe_file.mp4', STRICT_POLICY)
      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
      expect(result.severity).toBe('low')
    })

    test('应该检测特殊字符', () => {
      const result = flexibleValidateFilename('file@#$.mp4', STRICT_POLICY)
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('包含特殊字符')
      expect(result.severity).toBe('medium')
    })

    test('应该检测中文字符（严格模式）', () => {
      const result = flexibleValidateFilename('测试文件.mp4', STRICT_POLICY)
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('包含中文字符')
      expect(result.canAutoFix).toBe(true)
    })

    test('应该允许中文字符（灵活模式）', () => {
      const result = flexibleValidateFilename('测试文件.mp4', FLEXIBLE_POLICY)
      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    test('应该检测emoji字符', () => {
      const result = flexibleValidateFilename('🎬视频.mp4', STRICT_POLICY)
      expect(result.isValid).toBe(false)
      expect(result.issues).toContain('包含emoji字符')
      expect(result.severity).toBe('high')
    })
  })

  describe('getFilenameAdvice', () => {
    test('安全文件名应该返回原文件名', () => {
      const input = 'safe_file.mp4'
      const result = getFilenameAdvice(input, STRICT_POLICY)
      expect(result.recommended).toBe(input)
      expect(result.needsChange).toBe(false)
    })

    test('不安全文件名应该返回清理后的文件名', () => {
      const input = '🎬@#$%*.mp4'
      const result = getFilenameAdvice(input, STRICT_POLICY)
      expect(result.needsChange).toBe(true)
      expect(result.canAutoFix).toBe(true)
    })
  })

  describe('analyzeFilenames', () => {
    test('应该正确分析文件名批次', () => {
      const filenames = [
        'safe_file.mp4',
        '🎬emoji.mp4',
        '测试文件.mp4',
        'normal.jpg'
      ]
      
      const result = analyzeFilenames(filenames, STRICT_POLICY)
      
      expect(result.summary.total).toBe(4)
      expect(result.summary.needsChange).toBeGreaterThan(0)
      expect(result.results).toHaveLength(4)
    })
  })
})

describe('文件名处理集成测试', () => {
  test('完整的文件处理流程', () => {
    const problematicFilename = '🎬测试@#$视频.mp4'
    
    // 1. 验证文件名
    const validation = flexibleValidateFilename(problematicFilename, STRICT_POLICY)
    expect(validation.isValid).toBe(false)
    expect(validation.canAutoFix).toBe(true)
    
    // 2. 获取建议
    const advice = getFilenameAdvice(problematicFilename, STRICT_POLICY)
    expect(advice.needsChange).toBe(true)
    
    // 3. 清理文件名
    const cleaned = smartSanitizeFilename(problematicFilename, STRICT_POLICY)
    expect(cleaned).toMatch(/^ceshi.*\.mp4$/)
    
    // 4. 验证清理后的文件名
    const finalValidation = flexibleValidateFilename(cleaned, STRICT_POLICY)
    expect(finalValidation.isValid).toBe(true)
  })
})
