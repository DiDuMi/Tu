import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { fetcher } from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TinyMCEEditor from '@/components/content/TinyMCEEditor';
import CoverImageSelector from '@/components/content/CoverImageSelector';
import EnhancedTagSelector from '@/components/content/EnhancedTagSelector';
import ContentCreationProgress from '@/components/content/ContentCreationProgress';
import AutoSaveIndicator from '@/components/content/AutoSaveIndicator';
import KeyboardShortcuts from '@/components/content/KeyboardShortcuts';

import EditorTemplateButton from '@/components/content/templates/EditorTemplateButton';
import { useAutoSave } from '@/hooks/useAutoSave';
import { extractFirstImageFromContent } from '@/lib/cover-image-utils';
import { useHomepagePermissions } from '@/hooks/useHomepagePermissions';

export default function CreateContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  // 表单状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishMode, setPublishMode] = useState<'DRAFT' | 'PENDING' | 'REVIEW'>('DRAFT');

  // 封面图片状态
  const [coverImage, setCoverImage] = useState<string>('');

  // 模板功能状态
  const [templateRecommendationEnabled, setTemplateRecommendationEnabled] = useState(true);
  const [editorRef, setEditorRef] = useState<any>(null);

  // 获取分类列表 - 添加缓存配置
  const { data: categoriesData, error: categoriesError } = useSWR(
    session ? '/api/v1/categories' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1分钟内不重复请求
      focusThrottleInterval: 60000 // 1分钟内不因为focus而重新请求
    }
  );

  // 获取标签列表
  const { data: tagsData } = useSWR(
    session ? '/api/v1/tags' : null,
    fetcher
  );

  // 获取用户的草稿
  const { data: draftData, error: draftError } = useSWR(
    session ? '/api/v1/pages/draft' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30秒内不重复请求
    }
  );

  // 处理分类数据
  const allCategories = Array.isArray(categoriesData?.data)
    ? categoriesData?.data
    : categoriesData?.data?.items || [];

  // 使用权限Hook过滤分类
  const { availableCategories, isHomepageCategory } = useHomepagePermissions(allCategories);

  // 处理标签数据
  const tags = tagsData?.data?.items || [];

  // 自动保存功能
  const autoSaveData = {
    title,
    content,
    excerpt,
    categoryId,
    selectedTagIds,
    coverImage
  };

  const handleAutoSave = async (data: typeof autoSaveData) => {
    // 只有在有基本内容时才自动保存
    if (!data.title.trim() && !data.content.trim()) {
      return;
    }

    try {
      await fetch('/api/v1/pages/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title || '未命名草稿',
          content: data.content,
          excerpt: data.excerpt || undefined,
          categoryId: data.categoryId ? parseInt(data.categoryId, 10) : undefined,
          tagIds: data.selectedTagIds.length > 0 ? data.selectedTagIds : undefined,
          coverImage: data.coverImage || undefined,
          status: 'DRAFT'
        }),
      });
    } catch (error) {
      console.error('Auto save failed:', error);
      throw error;
    }
  };

  const {
    isSaving: isAutoSaving,
    lastSaved,
    saveError,
    saveNow,
    getLastSavedText
  } = useAutoSave(autoSaveData, {
    onSave: handleAutoSave,
    enabled: session !== null,
    delay: 5000 // 5秒延迟
  });

  // 加载草稿数据
  useEffect(() => {
    if (draftData?.data && !title && !content) {
      const draft = draftData.data;
      console.log('加载草稿数据:', draft);

      setTitle(draft.title || '');
      setContent(draft.content || '');
      setExcerpt(draft.excerpt || '');
      setCoverImage(draft.coverImage || '');

      if (draft.categoryId) {
        setCategoryId(draft.categoryId.toString());
      }

      if (draft.tagIds && draft.tagIds.length > 0) {
        setSelectedTagIds(draft.tagIds);
      }
    }
  }, [draftData, title, content]);

  // 自动提取封面图片
  useEffect(() => {
    if (content && !coverImage) {
      const firstImage = extractFirstImageFromContent(content);
      if (firstImage) {
        setCoverImage(firstImage);
      }
    }
  }, [content, coverImage]);

  // 处理标签选择
  const handleTagSelect = (tagId: number) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('标题不能为空');
      return;
    }

    if (!content.trim()) {
      setError('内容不能为空');
      return;
    }

    if (!categoryId) {
      setError('请选择分类');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          excerpt: excerpt || undefined,
          categoryId: parseInt(categoryId, 10),
          status: publishMode,
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
          coverImage: coverImage || undefined,
        }),
      });

      if (response.ok) {
        router.push('/dashboard/contents');
      } else {
        const errorData = await response.json();
        setError(errorData.message || '创建内容失败');
      }
    } catch (error) {
      console.error('创建内容时出错:', error);
      setError('创建内容时发生错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理发布
  const handlePublish = () => {
    setPublishMode('REVIEW');
    document.getElementById('content-form')?.dispatchEvent(
      new Event('submit', { cancelable: true, bubbles: true })
    );
  };

  // 处理取消
  const handleCancel = () => {
    router.push('/dashboard/contents');
  };

  // 处理模板插入
  const handleInsertTemplate = (templateContent: string, position: 'top' | 'cursor' | 'bottom') => {
    if (!editorRef) {
      // 如果编辑器引用不可用，直接根据位置插入
      switch (position) {
        case 'top':
          setContent(templateContent + '\n\n' + content);
          break;
        case 'bottom':
          setContent(content + '\n\n' + templateContent);
          break;
        case 'cursor':
        default:
          setContent(content + '\n\n' + templateContent);
          break;
      }
      return;
    }

    // 使用 TinyMCE 编辑器的 API 插入内容
    try {
      switch (position) {
        case 'top':
          editorRef.setContent(templateContent + '<br><br>' + editorRef.getContent());
          break;
        case 'bottom':
          editorRef.setContent(editorRef.getContent() + '<br><br>' + templateContent);
          break;
        case 'cursor':
        default:
          editorRef.insertContent('<br><br>' + templateContent);
          break;
      }
    } catch (error) {
      console.error('Insert template error:', error);
      // 如果编辑器 API 失败，回退到直接设置内容
      setContent(content + '\n\n' + templateContent);
    }
  };



  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
    </div>;
  }

  if (!session) {
    router.push('/auth/signin?callbackUrl=/dashboard/contents/create');
    return null;
  }

  return (
    <DashboardLayout title="发布内容 - 兔图">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">发布新内容</h1>
          <p className="mt-1 text-gray-500">创建并发布您的内容</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <form id="content-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* 主要内容区域 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 基本信息卡片 */}
              <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-1 h-6 bg-primary-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-semibold text-gray-900">基本信息</h3>
                  </div>

                  <div className="space-y-5">
                    {/* 标题 */}
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                        标题 <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="输入内容标题，使用 #标签 格式添加标签"
                        className="mt-2"
                        fullWidth
                        required
                      />
                      <p className="mt-2 text-xs text-gray-500 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        提示：在标题中使用 #标签 格式可以添加标签，例如：三度 - #鸣潮 #长离
                      </p>
                    </div>

                    {/* 摘要 */}
                    <div>
                      <Label htmlFor="excerpt" className="text-sm font-medium text-gray-700">
                        摘要（可选）
                      </Label>
                      <Textarea
                        id="excerpt"
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        placeholder="输入内容摘要，用于在列表页面和搜索结果中显示内容简介"
                        className="mt-2"
                        rows={3}
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        摘要用于在内容列表、搜索结果和分享预览中显示内容简介。如果不填写，系统将自动从正文内容中提取前200个字符作为摘要。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 内容编辑器卡片 */}
              <Card className="shadow-sm border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-1 h-6 bg-primary-500 rounded-full mr-3"></div>
                      <h3 className="text-lg font-semibold text-gray-900">内容编辑</h3>
                    </div>

                    {/* 编辑器工具栏 */}
                    <div className="flex items-center space-x-3">
                      {/* 预设模板按钮 */}
                      <EditorTemplateButton
                        onInsertTemplate={handleInsertTemplate}
                        title={title}
                      />

                      {/* 模板推荐开关 */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="templateRecommendation"
                          checked={templateRecommendationEnabled}
                          onChange={(e) => setTemplateRecommendationEnabled(e.target.checked)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <Label htmlFor="templateRecommendation" className="text-sm text-gray-600">
                          智能推荐
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <TinyMCEEditor
                      value={content}
                      onChange={setContent}
                      height={500}
                      placeholder="输入内容正文..."
                      onInit={(editor) => setEditorRef(editor)}
                    />
                  </div>
                </CardContent>
              </Card>


            </div>

            {/* 侧边栏设置区域 */}
            <div className="lg:col-span-1 space-y-4 lg:space-y-6">
              {/* 自动保存状态 */}
              <AutoSaveIndicator
                isSaving={isAutoSaving}
                lastSaved={lastSaved}
                saveError={saveError}
                getLastSavedText={getLastSavedText}
                onSaveNow={saveNow}
              />

              {/* 进度指示器 */}
              <ContentCreationProgress
                title={title}
                content={content}
                categoryId={categoryId}
                coverImage={coverImage}
                selectedTagIds={selectedTagIds}
              />

              {/* 发布设置卡片 */}
              <Card className="shadow-sm border border-gray-200 lg:sticky lg:top-6">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-1 h-6 bg-green-500 rounded-full mr-3"></div>
                    <h3 className="text-lg font-semibold text-gray-900">发布设置</h3>
                  </div>

                  <div className="space-y-5">
                    {/* 分类选择 */}
                    <div>
                      <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                        分类 <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        id="category"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="mt-2"
                        required
                        error={categoriesError ? "加载分类失败，请刷新页面重试" : undefined}
                      >
                        <option value="">选择分类</option>
                        {availableCategories && availableCategories.length > 0 ? (
                          availableCategories.map((category: any) => (
                            <option key={category.id} value={category.id}>
                              {category.name}{isHomepageCategory(category.slug) ? ' (首页分类)' : ''}
                            </option>
                          ))
                        ) : !categoriesError ? (
                          <option value="" disabled>加载分类中...</option>
                        ) : null}
                      </Select>
                      {categoriesError && (
                        <p className="mt-2 text-xs text-red-500 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          加载分类失败: {categoriesError.message || '未知错误'}
                        </p>
                      )}
                      {!categoriesError && (!allCategories || allCategories.length === 0) && (
                        <p className="mt-2 text-xs text-amber-500 flex items-center">
                          <svg className="w-3 h-3 mr-1 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                          正在加载分类，请稍候...
                        </p>
                      )}
                      {allCategories.length > availableCategories.length && (
                        <p className="mt-2 text-xs text-yellow-600 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          部分首页分类因权限限制未显示。如需发布到首页分类，请联系管理员。
                        </p>
                      )}
                    </div>

                    {/* 标签选择 */}
                    <EnhancedTagSelector
                      tags={tags}
                      selectedTagIds={selectedTagIds}
                      onTagSelect={handleTagSelect}
                    />

                    {/* 封面图片 */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700">封面图片</Label>
                      <div className="mt-2">
                        <CoverImageSelector
                          currentCover={coverImage}
                          onCoverSelect={setCoverImage}
                          editorContent={content}
                        />
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        可以从媒体库选择，或从编辑器内容中选择图片作为封面。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>


            </div>
          </div>

          {/* 操作按钮区域 */}
          <div className="mt-6 lg:mt-8 bg-white border-t border-gray-200 px-4 lg:px-6 py-4 lg:sticky lg:bottom-0 z-10 shadow-lg lg:shadow-none">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 lg:gap-4">
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {isAutoSaving ? '正在自动保存...' : lastSaved ? `${getLastSavedText()}` : '内容将自动保存草稿'}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="order-3 sm:order-1"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  onClick={() => setPublishMode('DRAFT')}
                  className="order-2 sm:order-2"
                  variant="outline"
                >
                  {isSubmitting && publishMode === 'DRAFT' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      保存中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6a1 1 0 10-2 0v5.586l-1.293-1.293z" />
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v1a1 1 0 11-2 0V4H7v1a1 1 0 11-2 0V4z" />
                      </svg>
                      保存为草稿
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="order-1 sm:order-3 bg-green-600 hover:bg-green-700 focus:ring-green-500"
                >
                  {isSubmitting && publishMode === 'REVIEW' ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      提交中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                      </svg>
                      提交审核
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* 快捷键支持 */}
        <KeyboardShortcuts
          onSave={() => {
            setPublishMode('DRAFT');
            document.getElementById('content-form')?.dispatchEvent(
              new Event('submit', { cancelable: true, bubbles: true })
            );
          }}
          onPublish={handlePublish}
          onCancel={handleCancel}
        />
      </div>
    </DashboardLayout>
  );
}
