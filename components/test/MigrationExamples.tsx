import React from 'react'

import MediaPreviewImage from '@/components/ui/MediaPreviewImage'
import { AvatarImage, CoverImage } from '@/components/ui/OptimizedImage'

import { useABTest } from './ABTestProvider'
import BenefitsSummaryPanel from './BenefitsSummaryPanel'
import CodeComparisonBlock from './CodeComparisonBlock'
import { CODE_EXAMPLES, MOCK_DATA } from './ExampleCodeBlock'
import MigrationExampleCard, { MigrationComparison } from './MigrationExampleCard'

// 模拟数据已移至 ExampleCodeBlock.tsx

/**
 * 头像组件迁移示例
 */
export function AvatarMigrationExample() {
  const { recordEvent } = useABTest('image-component')

  const handleAvatarClick = () => {
    recordEvent('avatar_click', { userId: MOCK_DATA.user.id })
  }

  return (
    <MigrationExampleCard title="头像组件迁移示例">
      <MigrationComparison
        beforeTitle="迁移前 (原生 img)"
        afterTitle="迁移后 (OptimizedImage)"
        beforeIssues="无优化、无懒加载、无错误处理"
        afterBenefits="✓ 自动优化 ✓ 错误处理 ✓ 加载状态 ✓ 重试机制"
        beforeContent={
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <img
              src={MOCK_DATA.user.avatar}
              alt={MOCK_DATA.user.name}
              className="w-12 h-12 rounded-full object-cover"
              onClick={handleAvatarClick}
            />
            <div>
              <p className="font-medium">{MOCK_DATA.user.name}</p>
              <p className="text-sm text-gray-600">{MOCK_DATA.user.email}</p>
            </div>
          </div>
        }
        afterContent={
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <AvatarImage
              src={MOCK_DATA.user.avatar}
              alt={MOCK_DATA.user.name}
              size={48}
              onClick={handleAvatarClick}
              onLoadComplete={() => recordEvent('avatar_load_success')}
              onErrorOccurred={() => recordEvent('avatar_load_error')}
            />
            <div>
              <p className="font-medium">{MOCK_DATA.user.name}</p>
              <p className="text-sm text-gray-600">{MOCK_DATA.user.email}</p>
            </div>
          </div>
        }
      />

      <CodeComparisonBlock
        beforeCode={CODE_EXAMPLES.avatar.before}
        afterCode={CODE_EXAMPLES.avatar.after}
      />
    </MigrationExampleCard>
  )
}

/**
 * 封面图片迁移示例
 */
export function CoverImageMigrationExample() {
  const { recordEvent } = useABTest('image-component')

  return (
    <MigrationExampleCard title="封面图片迁移示例">
      <MigrationComparison
        beforeTitle="迁移前 (原生 img)"
        afterTitle="迁移后 (CoverImage)"
        beforeIssues="布局偏移、无优化、加载阻塞"
        afterBenefits="✓ 防止布局偏移 ✓ 响应式图片 ✓ 自动优化格式"
        beforeContent={
          <div className="border rounded-lg overflow-hidden">
            <div className="relative w-full aspect-video">
              <img
                src={MOCK_DATA.content.coverImage}
                alt={MOCK_DATA.content.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-medium">{MOCK_DATA.content.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{MOCK_DATA.content.description}</p>
            </div>
          </div>
        }
        afterContent={
          <div className="border rounded-lg overflow-hidden">
            <CoverImage
              src={MOCK_DATA.content.coverImage}
              alt={MOCK_DATA.content.title}
              aspectRatio="16/9"
              onLoadComplete={() => recordEvent('cover_load_success')}
              onErrorOccurred={() => recordEvent('cover_load_error')}
            />
            <div className="p-4">
              <h3 className="font-medium">{MOCK_DATA.content.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{MOCK_DATA.content.description}</p>
            </div>
          </div>
        }
      />

      <CodeComparisonBlock
        beforeCode={CODE_EXAMPLES.cover.before}
        afterCode={CODE_EXAMPLES.cover.after}
      />
    </MigrationExampleCard>
  )
}

/**
 * 媒体预览迁移示例
 */
export function MediaPreviewMigrationExample() {
  const { variant } = useABTest('image-component')

  return (
    <MigrationExampleCard title="媒体预览迁移示例">
      <MigrationComparison
        beforeTitle="迁移前 (原生 img)"
        afterTitle="迁移后 (MediaPreviewImage)"
        beforeIssues="尺寸不一致、无尺寸信息、性能差"
        afterBenefits="✓ 统一尺寸 ✓ 显示尺寸信息 ✓ 智能优化 ✓ 类型识别"
        beforeContent={
          <div className="grid grid-cols-2 gap-4">
            {MOCK_DATA.media.map((media) => (
              <div key={media.id} className="border rounded-lg p-3">
                <img
                  src={media.preview}
                  alt={media.name}
                  className="w-full max-h-32 object-contain mb-2"
                />
                <p className="text-xs text-gray-600 truncate">{media.name}</p>
              </div>
            ))}
          </div>
        }
        afterContent={
          <div className="grid grid-cols-2 gap-4">
            {MOCK_DATA.media.map((media) => (
              <div key={media.id} className="border rounded-lg p-3">
                <MediaPreviewImage
                  src={media.preview}
                  alt={media.name}
                  type={media.type}
                  maxWidth={200}
                  maxHeight={128}
                  showInfo={true}
                  useOptimized={variant === 'nextjs-image'}
                  containerClassName="mb-2"
                />
                <p className="text-xs text-gray-600 truncate">{media.name}</p>
              </div>
            ))}
          </div>
        }
      />

      <CodeComparisonBlock
        beforeCode={CODE_EXAMPLES.mediaPreview.before}
        afterCode={CODE_EXAMPLES.mediaPreview.after}
      />
    </MigrationExampleCard>
  )
}

/**
 * 迁移收益总结
 */
export function MigrationBenefitsSummary() {
  return <BenefitsSummaryPanel />
}

const MigrationExamples = {
  AvatarMigrationExample,
  CoverImageMigrationExample,
  MediaPreviewMigrationExample,
  MigrationBenefitsSummary
}

export default MigrationExamples
