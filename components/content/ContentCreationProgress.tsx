import React from 'react'

interface ContentCreationProgressProps {
  title: string
  content: string
  categoryId: string
  coverImage: string
  selectedTagIds: number[]
}

export default function ContentCreationProgress({
  title,
  content,
  categoryId,
  coverImage,
  selectedTagIds
}: ContentCreationProgressProps) {
  // 计算完成状态
  const steps = [
    {
      id: 'title',
      label: '标题',
      completed: title.trim().length > 0,
      required: true
    },
    {
      id: 'content',
      label: '内容',
      completed: content.trim().length > 0,
      required: true
    },
    {
      id: 'category',
      label: '分类',
      completed: categoryId.length > 0,
      required: true
    },
    {
      id: 'cover',
      label: '封面图片',
      completed: coverImage.length > 0,
      required: false
    },
    {
      id: 'tags',
      label: '标签',
      completed: selectedTagIds.length > 0,
      required: false
    }
  ]

  const completedSteps = steps.filter(step => step.completed).length
  const requiredSteps = steps.filter(step => step.required).length
  const completedRequiredSteps = steps.filter(step => step.required && step.completed).length
  
  const progressPercentage = (completedSteps / steps.length) * 100
  const canPublish = completedRequiredSteps === requiredSteps

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">内容完成度</h4>
        <span className="text-xs text-gray-500">
          {completedSteps}/{steps.length}
        </span>
      </div>

      {/* 进度条 */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>进度</span>
          <span>{Math.round(progressPercentage)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              canPublish ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* 步骤列表 */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center text-sm">
            <div className="flex-shrink-0 mr-3">
              {step.completed ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                <div className={`w-4 h-4 rounded-full border-2 ${
                  step.required 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-gray-50'
                }`}>
                  {step.required && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <span className={`${
              step.completed 
                ? 'text-gray-900' 
                : step.required 
                  ? 'text-red-600' 
                  : 'text-gray-500'
            }`}>
              {step.label}
              {step.required && !step.completed && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* 状态提示 */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        {canPublish ? (
          <div className="flex items-center text-sm text-green-600">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            可以发布内容
          </div>
        ) : (
          <div className="flex items-center text-sm text-amber-600">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            请完成必填项目
          </div>
        )}
      </div>
    </div>
  )
}
